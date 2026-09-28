/**
 * 80% yetarli bo'lsa music_mix_play_counts dagi qatorni 1 ga oshiradi.
 * Kam bo'lsa yozuv yo'q. Tinglash progressi va tinglandi formulasi ochilmaydi.
 *
 * @module music-mixes/services/recordPlay.service
 */

'use strict';

const { findMixCatalogByIds } = require('../repositories/catalog.read');
const { incrementMixPlayCount } = require('../repositories/playCount.repository');
const { parseUserId } = require('../repositories/parseUserId');
const { normalizeMixContentType } = require('../contentType');
const { isQualifiedMixPlay } = require('./qualifyPlay');

const positiveDuration = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Katalogda uzunlik bo‘lsa shu. Bo‘lmasa pleer aytgan qo‘shiq uzunligi. */
const resolveDuration = (catalogDuration, reportedDuration) =>
  positiveDuration(catalogDuration) || positiveDuration(reportedDuration);

/**
 * Yozishdan oldin. 80% qo‘shiq uzunligiga qarab. Navbatga qo‘yilmaydi.
 *
 * @param {{ userId: string|import('mongoose').Types.ObjectId, contentId: string|number, listenedSeconds: number, sessionId: string, durationSec?: number, contentType?: string }} input
 * @returns {Promise<{ accept: boolean, reason: string|null, durationSec: number|null }>}
 */
const assessMixPlay = async ({
  userId,
  contentId,
  listenedSeconds,
  sessionId,
  durationSec,
  contentType = 'music',
}) => {
  const uid = parseUserId(userId);
  const id = String(contentId ?? '').trim();
  const session = String(sessionId || '').trim();
  const type = normalizeMixContentType(contentType);
  if (!uid || !id || !session) {
    return { accept: false, reason: 'invalid', durationSec: null };
  }

  const songs = await findMixCatalogByIds([id], type);
  const song = songs.find((row) => row.contentId === id);
  if (!song) {
    return { accept: false, reason: type === 'klip' ? 'not_clip' : 'not_song', durationSec: null };
  }
  const duration = resolveDuration(song.durationSec, durationSec);
  if (!isQualifiedMixPlay(listenedSeconds, duration)) {
    return { accept: false, reason: 'below_ratio', durationSec: duration };
  }
  return { accept: true, reason: null, durationSec: duration };
};

/**
 * @param {{ userId: string|import('mongoose').Types.ObjectId, contentId: string|number, listenedSeconds: number, sessionId: string, durationSec?: number, playedAt?: Date, contentType?: string }} input
 * @returns {Promise<{ counted: boolean, reason?: string, playCount?: number, genre?: string, contentId?: string, contentType?: string }>}
 */
const recordMixPlay = async ({
  userId,
  contentId,
  listenedSeconds,
  sessionId,
  durationSec,
  playedAt = new Date(),
  contentType = 'music',
}) => {
  const uid = parseUserId(userId);
  const id = String(contentId ?? '').trim();
  const session = String(sessionId || '').trim();
  const type = normalizeMixContentType(contentType);
  if (!uid || !id || !session) {
    return { counted: false, reason: 'invalid' };
  }

  const songs = await findMixCatalogByIds([id], type);
  const song = songs.find((row) => row.contentId === id);
  if (!song) {
    return { counted: false, reason: type === 'klip' ? 'not_clip' : 'not_song' };
  }

  if (!isQualifiedMixPlay(listenedSeconds, resolveDuration(song.durationSec, durationSec))) {
    return { counted: false, reason: 'below_ratio' };
  }

  const saved = await incrementMixPlayCount(uid, song.contentId, song.genre, session, playedAt, type);
  if (!saved) {
    return { counted: false, reason: 'invalid' };
  }
  if (saved.sameSession) {
    return {
      counted: false,
      reason: 'same_session',
      contentId: saved.contentId,
      contentType: type,
      playCount: saved.playCount,
    };
  }

  return {
    counted: true,
    contentId: saved.contentId,
    contentType: type,
    genre: saved.genre,
    playCount: saved.playCount,
  };
};

module.exports = {
  assessMixPlay,
  recordMixPlay,
};
