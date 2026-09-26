/**
 * 80% yetarli bo'lsa music_mix_play_counts dagi qatorni 1 ga oshiradi.
 * Kam bo'lsa yozuv yo'q. Tinglash progressi va tinglandi formulasi ochilmaydi.
 *
 * @module music-mixes/services/recordPlay.service
 */

'use strict';

const { findMixSongsByIds } = require('../repositories/catalog.read');
const { incrementMixPlayCount } = require('../repositories/playCount.repository');
const { parseUserId } = require('../repositories/parseUserId');
const { isQualifiedMixPlay } = require('./qualifyPlay');

/**
 * Yozishdan oldin. 80% katalog davomiyligiga qarab. Navbatga qo‘yilmaydi.
 *
 * @param {{ userId: string|import('mongoose').Types.ObjectId, contentId: string|number, listenedSeconds: number, sessionId: string }} input
 * @returns {Promise<{ accept: boolean, reason: string|null, durationSec: number|null }>}
 */
const assessMixPlay = async ({ userId, contentId, listenedSeconds, sessionId }) => {
  const uid = parseUserId(userId);
  const id = String(contentId ?? '').trim();
  const session = String(sessionId || '').trim();
  if (!uid || !id || !session) {
    return { accept: false, reason: 'invalid', durationSec: null };
  }

  const songs = await findMixSongsByIds([id]);
  const song = songs.find((row) => row.contentId === id);
  if (!song) {
    return { accept: false, reason: 'not_song', durationSec: null };
  }
  if (!isQualifiedMixPlay(listenedSeconds, song.durationSec)) {
    return { accept: false, reason: 'below_ratio', durationSec: song.durationSec };
  }
  return { accept: true, reason: null, durationSec: song.durationSec };
};

/**
 * @param {{ userId: string|import('mongoose').Types.ObjectId, contentId: string|number, listenedSeconds: number, sessionId: string, playedAt?: Date }} input
 * @returns {Promise<{ counted: boolean, reason?: string, playCount?: number, genre?: string, contentId?: string }>}
 */
const recordMixPlay = async ({
  userId,
  contentId,
  listenedSeconds,
  sessionId,
  playedAt = new Date(),
}) => {
  const uid = parseUserId(userId);
  const id = String(contentId ?? '').trim();
  const session = String(sessionId || '').trim();
  if (!uid || !id || !session) {
    return { counted: false, reason: 'invalid' };
  }

  const songs = await findMixSongsByIds([id]);
  const song = songs.find((row) => row.contentId === id);
  if (!song) {
    return { counted: false, reason: 'not_song' };
  }

  if (!isQualifiedMixPlay(listenedSeconds, song.durationSec)) {
    return { counted: false, reason: 'below_ratio' };
  }

  const saved = await incrementMixPlayCount(uid, song.contentId, song.genre, session, playedAt);
  if (!saved) {
    return { counted: false, reason: 'invalid' };
  }
  if (saved.sameSession) {
    return {
      counted: false,
      reason: 'same_session',
      contentId: saved.contentId,
      playCount: saved.playCount,
    };
  }

  return {
    counted: true,
    contentId: saved.contentId,
    genre: saved.genre,
    playCount: saved.playCount,
  };
};

module.exports = {
  assessMixPlay,
  recordMixPlay,
};
