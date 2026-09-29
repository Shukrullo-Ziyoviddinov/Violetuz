/**
 * Share token bo'yicha o'qish.
 * Public. Qabul qiluvchi music_mixes / play_counts ga yozilmaydi.
 * Ega mixi hali bor bo'lsa — live tracks; aks holda snapshot.
 * Har o'qishda TTL uzaytiriladi (faol link o'lik bo'lmasin).
 *
 * @module music-mixes/services/getMixShare.service
 */

'use strict';

const Music = require('../../models/Music.model');
const Clip = require('../../models/Clip.model');
const { notFound } = require('../../utils/errors');
const { resolveMediaUrl } = require('../../utils/resolveMediaUrl');
const { musicMixWeights } = require('../config/musicMixWeights');
const { MusicMix } = require('../models');
const {
  findMixShareByToken,
  refreshMixShareDocument,
} = require('../repositories/mixShare.repository');

const resolveCoverImg = async (contentId, contentType) => {
  const idNum = Number(String(contentId).trim());
  if (!Number.isInteger(idNum)) return '';
  const Model = contentType === 'klip' ? Clip : Music;
  const row = await Model.findOne({ id: idNum }).select({ img: 1, _id: 0 }).lean();
  return resolveMediaUrl(String(row?.img || '').trim());
};

const loadOwnerLiveTracks = async (share) => {
  if (!share?.ownerUserId || !share.genre) return null;
  const minMixSize = Math.max(1, Number(musicMixWeights.minMixSize) || 4);
  const query = { userId: share.ownerUserId, genre: share.genre };
  if (share.contentType === 'klip') {
    query.contentType = 'klip';
  } else {
    query.$or = [{ contentType: 'music' }, { contentType: { $exists: false } }];
  }

  const rows = await MusicMix.find(query)
    .select({ contentId: 1, position: 1, _id: 0 })
    .sort({ position: 1 })
    .lean();

  const tracks = (rows || [])
    .map((row, index) => ({
      contentId: String(row.contentId || '').trim(),
      position: Math.max(1, Number(row.position) || index + 1),
    }))
    .filter((row) => row.contentId);

  if (tracks.length < minMixSize) return null;

  const leadId = tracks[0].contentId;
  const coverImg = await resolveCoverImg(leadId, share.contentType);
  return { tracks, leadId, coverImg };
};

/**
 * @param {string} token
 * @param {{ allowExpired?: boolean }} [opts]
 */
const getMixShareByToken = async (token, opts = {}) => {
  const allowExpired = Boolean(opts.allowExpired);
  const share = await findMixShareByToken(token, { allowExpired });
  if (!share) {
    throw notFound('share topilmadi yoki muddati o‘tgan');
  }
  if (share.expired) {
    return share;
  }

  const live = await loadOwnerLiveTracks(share);
  if (live?.tracks?.length) {
    const refreshed = await refreshMixShareDocument(share.token, live);
    return refreshed || { ...share, ...live, expired: false };
  }

  const touched = await refreshMixShareDocument(share.token, {
    coverImg: resolveMediaUrl(share.coverImg),
  });
  if (touched) return touched;
  return {
    ...share,
    coverImg: resolveMediaUrl(share.coverImg),
  };
};

module.exports = {
  getMixShareByToken,
};
