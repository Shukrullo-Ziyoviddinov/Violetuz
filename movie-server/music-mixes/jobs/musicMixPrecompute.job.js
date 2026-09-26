/**
 * Tayyor mixni vaqti-vaqti bilan music_mixes ga yozadi.
 * Sahifa ochilganda hisoblanmaydi. Bo'lim va kino navbatiga yozilmaydi.
 *
 * @module music-mixes/jobs/musicMixPrecompute.job
 */

'use strict';

const { musicMixWeights } = require('../config/musicMixWeights');
const { MusicMix, MusicMixPlayCount } = require('../models');
const { parseUserId } = require('../repositories/parseUserId');
const { replaceUserMixes } = require('../repositories/musicMix.repository');
const { buildUserMixes } = require('../services/mixEngine');

/** @type {ReturnType<typeof setInterval>|null} */
let timer = null;
/** @type {ReturnType<typeof setTimeout>|null} */
let bootTimer = null;
let running = false;

/**
 * Martasi yoki eski mixi bor foydalanuvchilar.
 * Eski mix 3 martaga yetmay qolsa ham o'chirish uchun kiradi.
 *
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
const listMusicMixUserIds = async () => {
  const [played, mixed] = await Promise.all([
    MusicMixPlayCount.distinct('userId'),
    MusicMix.distinct('userId'),
  ]);

  /** @type {Map<string, import('mongoose').Types.ObjectId>} */
  const byId = new Map();
  for (const id of [...played, ...mixed]) {
    const parsed = parseUserId(id);
    if (!parsed) continue;
    byId.set(String(parsed), parsed);
  }
  return [...byId.values()];
};

/**
 * @returns {Promise<{ users: number, written: number }>}
 */
const refreshMusicMixes = async () => {
  const userIds = await listMusicMixUserIds();
  let written = 0;

  for (const userId of userIds) {
    const mixes = await buildUserMixes(userId);
    const saved = await replaceUserMixes(userId, mixes);
    written += saved.written;
  }

  return { users: userIds.length, written };
};

const startMusicMixPrecomputeScheduler = (options = {}) => {
  const intervalMs = Number(options.intervalMs) || musicMixWeights.precomputeIntervalMs;
  const initialDelayMs = Math.max(0, Number(options.initialDelayMs) ?? 35_000);
  if (timer || bootTimer) return { started: false, reason: 'already_running', intervalMs };

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await refreshMusicMixes();
      // eslint-disable-next-line no-console
      console.log(
        `[music-mixes:precompute] users=${result.users} rows=${result.written}`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[music-mixes:precompute] failed:', err?.message || err);
    } finally {
      running = false;
    }
  };

  if (options.runImmediately !== false) {
    bootTimer = setTimeout(() => {
      bootTimer = null;
      tick();
    }, initialDelayMs);
    if (typeof bootTimer.unref === 'function') bootTimer.unref();
  }

  timer = setInterval(tick, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  return { started: true, intervalMs, initialDelayMs };
};

const stopMusicMixPrecomputeScheduler = () => {
  if (bootTimer) {
    clearTimeout(bootTimer);
    bootTimer = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  listMusicMixUserIds,
  refreshMusicMixes,
  startMusicMixPrecomputeScheduler,
  stopMusicMixPrecomputeScheduler,
};
