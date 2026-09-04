/**
 * Lightweight in-process job queue (swap-ready for BullMQ later).
 * Watch handlers enqueue and return immediately; workers run async.
 * Supports retries + coalesceKey (dedupe pending jobs with same key).
 *
 * Limits (MVP):
 *   - Process restart drops pending jobs (progress lastAffinityCompletion retries;
 *     trending uses Mongo lock only for multi-instance cron overlap).
 *   - For durable multi-worker queues, replace with Bull/Redis later — keep job
 *     names/payloads stable.
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
 */

class InProcessQueue {
  /**
   * @param {Object} [options]
   * @param {string} [options.name]
   * @param {number} [options.concurrency]
   * @param {number} [options.defaultMaxAttempts]
   * @param {number} [options.retryDelayMs]
   * @param {(err: Error, job: QueueJob) => void} [options.onError]
   */
  constructor(options = {}) {
    this.name = options.name || 'recommendation';
    this.concurrency = Math.max(1, options.concurrency || 1);
    this.defaultMaxAttempts = Math.max(1, options.defaultMaxAttempts || 3);
    this.retryDelayMs = Math.max(0, options.retryDelayMs || 500);
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
   * @param {string} [opts.coalesceKey] — same key replaces pending job (keeps latest payload)
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

    if (coalesceKey) {
      const idx = this.pending.findIndex(
        (j) =>
          j.name === jobName &&
          j.coalesceKey === coalesceKey &&
          !j.awaitable
      );
      if (idx >= 0) {
        this.pending[idx] = {
          name: jobName,
          payload,
          awaitable: false,
          attempt: 0,
          maxAttempts,
          coalesceKey,
        };
        return { queued: true, jobName, coalesced: true };
      }
    }

    this.pending.push({
      name: jobName,
      payload,
      awaitable: false,
      attempt: 0,
      maxAttempts,
      coalesceKey,
    });
    this._pump();
    return { queued: true, jobName, coalesced: false };
  }

  /**
   * Awaitable enqueue (tests / admin flush).
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
      this.pending.push({
        name: jobName,
        payload,
        resolve,
        reject,
        awaitable: true,
        attempt: 0,
        maxAttempts,
        coalesceKey: null,
      });
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

    try {
      const result = await handler(job.payload);
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
        setTimeout(() => {
          this.pending.push({
            ...job,
            attempt,
          });
          this._pump();
        }, delay);
        return undefined;
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
});

module.exports = {
  InProcessQueue,
  recommendationQueue,
};
