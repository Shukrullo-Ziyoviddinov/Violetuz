/**
 * Mix martasi navbati. Xotirada, javobni kutmaydi.
 * recommendation_queued_jobs, kino navbati va musiqa bo'limi navbati ochilmaydi.
 *
 * @module music-mixes/jobs/playEventQueue
 */

'use strict';

const { recordMixPlay } = require('../services/recordPlay.service');

const JOB_NAME = 'music-mix-play';

/** @type {Array<{ key: string, payload: Object }>} */
const pending = [];
let running = false;
/** @type {Promise<void>|null} */
let idle = null;
/** @type {(() => void)|null} */
let idleResolve = null;

const jobKey = (payload) =>
  `${payload.userId}:${payload.contentId}:${payload.sessionId}`;

const ensureIdle = () => {
  if (!idle) {
    idle = new Promise((resolve) => {
      idleResolve = resolve;
    });
  }
  return idle;
};

const finishIdle = () => {
  if (idleResolve) idleResolve();
  idle = null;
  idleResolve = null;
};

const drain = async () => {
  if (running) return;
  running = true;
  try {
    while (pending.length) {
      const job = pending.shift();
      try {
        await recordMixPlay(job.payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[${JOB_NAME}] failed:`, err?.message || err);
      }
    }
  } finally {
    running = false;
    if (pending.length) {
      setImmediate(drain);
      return;
    }
    finishIdle();
  }
};

/**
 * Hisobni navbatga qo'yadi va darhol qaytadi.
 *
 * @param {{ userId: string|import('mongoose').Types.ObjectId, contentId: string, listenedSeconds: number, sessionId: string }} payload
 * @returns {{ queued: true, jobName: string }}
 */
const enqueueMixPlay = (payload) => {
  const key = jobKey(payload);
  const already = pending.some((job) => job.key === key);
  if (!already) {
    pending.push({ key, payload });
    ensureIdle();
    setImmediate(drain);
  }
  return { queued: true, jobName: JOB_NAME };
};

const playQueueSize = () => pending.length;

/** Navbatdagi ish tugaguncha kutadi. HTTP bu funksiyani chaqirmaydi. */
const flushPlayQueue = async () => {
  if (!running && pending.length === 0) return;
  await ensureIdle();
};

module.exports = {
  JOB_NAME,
  enqueueMixPlay,
  playQueueSize,
  flushPlayQueue,
};
