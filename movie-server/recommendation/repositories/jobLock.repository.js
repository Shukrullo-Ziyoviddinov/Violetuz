/**
 * Mongo-backed job locks (multi-instance cron).
 * In-process queue restart’da yo‘qoladi — lock faqat parallel cron’ni to‘xtatadi.
 * Durable queue kerak bo‘lsa keyinroq Bull/Redis.
 *
 * @module recommendation/repositories/jobLock.repository
 */

'use strict';

const os = require('os');
const { JobLock } = require('../models');

const defaultOwner = () =>
  `${os.hostname()}:${process.pid}:${Math.random().toString(36).slice(2, 8)}`;

/**
 * @param {string} jobName
 * @param {number} ttlMs
 * @param {string} [owner]
 * @returns {Promise<{ acquired: boolean, owner: string|null, lockedUntil: Date|null }>}
 */
const tryAcquireJobLock = async (jobName, ttlMs, owner = defaultOwner()) => {
  const name = String(jobName || '').trim();
  if (!name) return { acquired: false, owner: null, lockedUntil: null };

  const now = new Date();
  const lockedUntil = new Date(now.getTime() + Math.max(1000, Number(ttlMs) || 60_000));

  // 1) Muddati o‘tgan lock’ni egallash
  const stolen = await JobLock.findOneAndUpdate(
    { jobName: name, lockedUntil: { $lte: now } },
    { $set: { owner, lockedUntil } },
    { new: true, lean: true }
  );
  if (stolen && stolen.owner === owner) {
    return { acquired: true, owner, lockedUntil: stolen.lockedUntil };
  }

  // 2) Yangi lock yaratish
  try {
    const created = await JobLock.create({
      jobName: name,
      owner,
      lockedUntil,
    });
    return {
      acquired: true,
      owner,
      lockedUntil: created.lockedUntil,
    };
  } catch (err) {
    if (err && (err.code === 11000 || err.codeName === 'DuplicateKey')) {
      // Boshqa instance ushlab turibdi
      return { acquired: false, owner: null, lockedUntil: null };
    }
    throw err;
  }
};

/**
 * Faqat o‘z owner’i bo‘lsa bo‘shatadi.
 * @param {string} jobName
 * @param {string} owner
 * @returns {Promise<boolean>}
 */
const releaseJobLock = async (jobName, owner) => {
  const name = String(jobName || '').trim();
  if (!name || !owner) return false;

  const res = await JobLock.deleteOne({
    jobName: name,
    owner: String(owner),
  });

  return (res?.deletedCount || 0) > 0;
};

module.exports = {
  tryAcquireJobLock,
  releaseJobLock,
  defaultOwner,
};
