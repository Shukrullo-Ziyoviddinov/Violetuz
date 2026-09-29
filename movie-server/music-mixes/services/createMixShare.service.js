/**
 * Egasining tayyor mixidan share snapshot.
 * Qabul qiluvchi music_mixes / play_counts ga yozilmaydi.
 *
 * @module music-mixes/services/createMixShare.service
 */

'use strict';

const Music = require('../../models/Music.model');
const Clip = require('../../models/Clip.model');
const { badRequest, notFound } = require('../../utils/errors');
const { resolveMediaUrl } = require('../../utils/resolveMediaUrl');
const { musicMixWeights } = require('../config/musicMixWeights');
const { normalizeMixContentType } = require('../contentType');
const { MusicMix } = require('../models');
const { createOrRefreshMixShare } = require('../repositories/mixShare.repository');
const { parseUserId } = require('../repositories/parseUserId');


/**
 * @param {string} contentId
 * @param {'music'|'klip'} contentType
 * @returns {Promise<string>}
 */
const resolveCoverImg = async (contentId, contentType) => {
  const idNum = Number(String(contentId).trim());
  if (!Number.isInteger(idNum)) return '';

  const Model = contentType === 'klip' ? Clip : Music;
  const row = await Model.findOne({ id: idNum }).select({ img: 1, _id: 0 }).lean();
  return resolveMediaUrl(String(row?.img || '').trim());
};

/**
 * @param {object} input
 * @param {string|import('mongoose').Types.ObjectId} input.userId
 * @param {string} [input.contentType]
 * @param {string} input.genre
 * @returns {Promise<{
 *   token: string,
 *   contentType: string,
 *   genre: string,
 *   leadId: string,
 *   coverImg: string,
 *   trackCount: number,
 *   expiresAt: Date,
 * }>}
 */
const createUserMixShare = async (input) => {
  const userId = parseUserId(input?.userId);
  const contentType = normalizeMixContentType(input?.contentType);
  const genre = String(input?.genre || '').trim();
  const minMixSize = Math.max(1, Number(musicMixWeights.minMixSize) || 4);

  if (!userId) throw badRequest('user kerak');
  if (!genre) throw badRequest('genre kerak');

  const query = { userId, genre };
  if (contentType === 'klip') {
    query.contentType = 'klip';
  } else {
    query.$or = [{ contentType: 'music' }, { contentType: { $exists: false } }];
  }

  const rows = await MusicMix.find(query)
    .select({ contentId: 1, position: 1, _id: 0 })
    .sort({ position: 1 })
    .lean();

  if (!rows.length) {
    throw notFound(`mix topilmadi: ${genre}`);
  }

  const tracks = rows
    .map((row, index) => ({
      contentId: String(row.contentId || '').trim(),
      position: Math.max(1, Number(row.position) || index + 1),
    }))
    .filter((row) => row.contentId);

  if (tracks.length < minMixSize) {
    throw badRequest(`mix uchun kamida ${minMixSize} ta element kerak`);
  }

  const leadId = tracks[0].contentId;
  const coverImg = await resolveCoverImg(leadId, contentType);

  const share = await createOrRefreshMixShare({
    ownerUserId: userId,
    contentType,
    genre,
    leadId,
    coverImg,
    tracks,
  });

  if (!share) throw badRequest('share yaratilmadi');

  return {
    token: share.token,
    contentType: share.contentType,
    genre: share.genre,
    leadId: share.leadId,
    coverImg: share.coverImg || '',
    trackCount: share.tracks.length,
    expiresAt: share.expiresAt,
  };
};

module.exports = {
  createUserMixShare,
};
