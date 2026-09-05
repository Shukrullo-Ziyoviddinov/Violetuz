/**
 * In-process job queue with optional Mongo durability.
 *
 * - Memory path: low-latency (same process).
 * - Durable path: pending/retry rows in recommendation_queued_jobs survive restart.
 * - Bull/Redis still optional later — job names/payloads stay stable.
 *
 * @module recommendation/jobs/inProcessQueue
 */

'use strict';

/**
 * @typedef {Object} QueueJob
 * @property {string} name
 * @property {*} payload
 * @property {(value?: *) => void} [resolve]
 * @property {(err: Error) => void} [reject]
 * @property {boolean} [awaitable]
 * @property {number} [attempt]
 * @property {number} [maxAttempts]
 * @property {string|null} [coalesceKey]
 * @property {string|null} [durableId]
 */

class InProcessQueue {
  /**
   * @param {Object} [options]
   * @param {string} [options.name]
   * @param {number} [options.concurrency]
   * @param {number} [options.defaultMaxAttempts]
   * @param {number} [options.retryDelayMs]
   * @param {boolean} [options.durable=true] — persist when Mongo is connected
   * @param {(err: Error, job: QueueJob) => void} [options.onError]
   */
  constructor(options = {}) {
    this.name = options.name || 'recommendation';
    this.concurrency = Math.max(1, options.concurrency || 1);
    this.defaultMaxAttempts = Math.max(1, options.defaultMaxAttempts || 3);
    this.retryDelayMs = Math.max(0, options.retryDelayMs || 500);
    this.durable = options.durable !== false;
    this.onError =
      options.onError ||
      ((err, job) => {
        // eslint-disable-next-line no-console
        console.error(`[${this.name}] job "${job.name}" failed:`, err.message);
      });

    /** @type {Map<string, (payload: *) => Promise<*>>} */
    this.handlers = new Map();
    /** @type {QueueJob[]} */
    this.pending = [];
    this.active = 0;
    /** @type {Set<string>} coalesce keys currently running */
    this.inFlightCoalesce = new Set();
    this._recovering = false;
  }

  /**
   * @param {string} jobName
   * @param {(payload: *) => Promise<*>} handler
   */
  register(jobName, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for "${jobName}" must be a function`);
    }
    this.handlers.set(jobName, handler);
  }

  /**
   * @param {string} jobName
   * @param {*} payload
   * @param {Object} [opts]
   * @param {string} [opts.coalesceKey]
   * @param {number} [opts.maxAttempts]
   * @returns {{ queued: true, jobName: string, coalesced?: boolean }}
   */
  enqueue(jobName, payload, opts = {}) {
    if (!this.handlers.has(jobName)) {
      throw new Error(`No handler registered for job "${jobName}"`);
    }

    const coalesceKey =
      typeof opts.coalesceKey === 'string' && opts.coalesceKey
        ? opts.coalesceKey
        : null;
    const maxAttempts = Math.max(
      1,
      opts.maxAttempts || this.defaultMaxAttempts
    );

    /** @type {QueueJob} */
    const job = {
      name: jobName,
      payload,
      awaitable: false,
      attempt: 0,
      maxAttempts,
      coalesceKey,
      durableId: null,
    };

    if (coalesceKey) {
      const idx = this.pending.findIndex(
        (j) =>
          j.name === jobName &&
          j.coalesceKey === coalesceKey &&
          !j.awaitable
      );
      if (idx >= 0) {
        const prevId = this.pending[idx].durableId;
        this.pending[idx] = { ...job, durableId: prevId || null };
        this._persistJob(this.pending[idx]);
        return { queued: true, jobName, coalesced: true };
      }
    }

    // Durable: persist then enqueue so restart recovery cannot miss / double-finish.
    if (this.durable) {
      setImmediate(() => {
        Promise.resolve()
          .then(async () => {
            const {
              isMongoReady,
              persistEnqueue,
            } = require('../repositories/queuedJob.repository');
            if (isMongoReady()) {
              const doc = await persistEnqueue({
                name: job.name,
                payload: job.payload,
                coalesceKey: job.coalesceKey,
                maxAttempts: job.maxAttempts,
              });
              if (doc && doc._id) job.durableId = String(doc._id);
            }
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error(
              `[${this.name}] durable persist failed:`,
              err?.message || err
            );
          })
          .finally(() => {
            this.pending.push(job);
            this._pump();
          });
      });
      return { queued: true, jobName, coalesced: false };
    }

    this.pending.push(job);
    this._pump();
    return { queued: true, jobName, coalesced: false };
  }

  /**
   * @param {string} jobName
   * @param {*} payload
   * @param {Object} [opts]
   * @returns {Promise<*>}
   */
  enqueueAndWait(jobName, payload, opts = {}) {
    if (!this.handlers.has(jobName)) {
      return Promise.reject(new Error(`No handler registered for job "${jobName}"`));
    }

    const maxAttempts = Math.max(
      1,
      opts.maxAttempts || this.defaultMaxAttempts
    );

    return new Promise((resolve, reject) => {
      /** @type {QueueJob} */
      const job = {
        name: jobName,
        payload,
        resolve,
        reject,
        awaitable: true,
        attempt: 0,
        maxAttempts,
        coalesceKey: null,
        durableId: null,
      };
      this.pending.push(job);
      this._persistJob(job);
      this._pump();
    });
  }

  /** @returns {{ pending: number, active: number }} */
  stats() {
    return { pending: this.pending.length, active: this.active };
  }

  /** Drain queue (tests). */
  async drain() {
    while (this.pending.length > 0 || this.active > 0) {
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  /**
   * After connectDB: re-queue pending durable jobs (and unstick crashed "running").
   * @returns {Promise<{ recovered: number }>}
   */
  async recoverFromDurableStore() {
    if (!this.durable || this._recovering) return { recovered: 0 };
    this._recovering = true;

    try {
      const {
        isMongoReady,
        recoverDurableJobs,
      } = require('../repositories/queuedJob.repository');
      if (!isMongoReady()) return { recovered: 0 };

      const rows = await recoverDurableJobs(500);
      let recovered = 0;

      for (const row of rows) {
        if (!this.handlers.has(row.name)) continue;

        const coalesceKey = row.coalesceKey || null;
        if (coalesceKey) {
          const already =
            this.pending.some(
              (j) => j.coalesceKey === coalesceKey && !j.awaitable
            ) || this.inFlightCoalesce.has(coalesceKey);
          if (already) continue;
        }

        this.pending.push({
          name: row.name,
          payload: row.payload,
          awaitable: false,
          attempt: Number(row.attempt) || 0,
          maxAttempts: Number(row.maxAttempts) || this.defaultMaxAttempts,
          coalesceKey,
          durableId: String(row._id),
        });
        recovered += 1;
      }

      if (recovered > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[${this.name}] recovered ${recovered} durable job(s) after restart`
        );
        this._pump();
      }

      return { recovered };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `[${this.name}] durable recover failed:`,
        err?.message || err
      );
      return { recovered: 0 };
    } finally {
      this._recovering = false;
    }
  }

  /**
   * Fire-and-forget coalesce update for an already-pending memory job.
   * @param {QueueJob} job
   */
  _persistJob(job) {
    if (!this.durable || job.awaitable) return;

    setImmediate(() => {
      Promise.resolve()
        .then(async () => {
          const { persistEnqueue } = require('../repositories/queuedJob.repository');
          const doc = await persistEnqueue({
            name: job.name,
            payload: job.payload,
            coalesceKey: job.coalesceKey,
            maxAttempts: job.maxAttempts,
          });
          if (doc && doc._id) {
            job.durableId = String(doc._id);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(
            `[${this.name}] durable persist failed:`,
            err?.message || err
          );
        });
    });
  }

  _pump() {
    while (this.active < this.concurrency && this.pending.length > 0) {
      const idx = this.pending.findIndex(
        (j) => !j.coalesceKey || !this.inFlightCoalesce.has(j.coalesceKey)
      );
      if (idx < 0) break;

      const job = this.pending.splice(idx, 1)[0];
      if (job.coalesceKey) this.inFlightCoalesce.add(job.coalesceKey);

      this.active += 1;
      this._run(job).finally(() => {
        if (job.coalesceKey) this.inFlightCoalesce.delete(job.coalesceKey);
        this.active -= 1;
        this._pump();
      });
    }
  }

  /**
   * @param {QueueJob} job
   */
  async _run(job) {
    const handler = this.handlers.get(job.name);
    const attempt = (job.attempt || 0) + 1;
    const maxAttempts = job.maxAttempts || this.defaultMaxAttempts;

    if (job.durableId && this.durable) {
      try {
        const { claimJob } = require('../repositories/queuedJob.repository');
        await claimJob(job.durableId);
      } catch {
        /* best-effort */
      }
    }

    try {
      const result = await handler(job.payload);
      if (job.durableId && this.durable) {
        try {
          const { markJobDone } = require('../repositories/queuedJob.repository');
          await markJobDone(job.durableId);
        } catch {
          /* best-effort */
        }
      }
      if (job.awaitable && job.resolve) job.resolve(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxAttempts) {
        const delay = this.retryDelayMs * attempt;
        // eslint-disable-next-line no-console
        console.warn(
          `[${this.name}] job "${job.name}" attempt ${attempt}/${maxAttempts} failed, retry in ${delay}ms:`,
          error.message
        );

        if (job.durableId && this.durable) {
          try {
            const {
              markJobRetryOrFail,
            } = require('../repositories/queuedJob.repository');
            await markJobRetryOrFail(job.durableId, {
              attempt,
              maxAttempts,
              errorMessage: error.message,
              retryDelayMs: this.retryDelayMs,
            });
          } catch {
            /* best-effort */
          }
        }

        setTimeout(() => {
          this.pending.push({
            ...job,
            attempt,
          });
          this._pump();
        }, delay);
        return undefined;
      }

      if (job.durableId && this.durable) {
        try {
          const {
            markJobRetryOrFail,
          } = require('../repositories/queuedJob.repository');
          await markJobRetryOrFail(job.durableId, {
            attempt,
            maxAttempts,
            errorMessage: error.message,
            retryDelayMs: this.retryDelayMs,
          });
        } catch {
          /* best-effort */
        }
      }

      this.onError(error, { ...job, attempt });
      if (job.awaitable && job.reject) job.reject(error);
      return undefined;
    }
  }
}

/** Shared recommendation queue singleton */
const recommendationQueue = new InProcessQueue({
  name: 'recommendation-queue',
  concurrency: 2,
  defaultMaxAttempts: 3,
  retryDelayMs: 500,
  durable: true,
});

module.exports = {
  InProcessQueue,
  recommendationQueue,
};
