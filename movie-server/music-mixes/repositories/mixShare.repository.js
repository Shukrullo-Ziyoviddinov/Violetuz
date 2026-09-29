/**
 * Mix share snapshot. Collection: music_mix_shares
 * Yaratish + token bo'yicha o'qish. Qabul qiluvchi mixiga yozilmaydi.
 *
 * @module music-mixes/repositories/mixShare.repository
 */

'use strict';

const crypto = require('crypto');
const { MusicMixShare } = require('../models');
const { musicMixWeights } = require('../config/musicMixWeights');
const { normalizeMixContentType } = require('../contentType');
const { parseUserId } = require('./parseUserId');

const makeToken = () => crypto.randomBytes(16).toString('hex');

/**
 * @param {object} input
 * @param {string|import('mongoose').Types.ObjectId} input.ownerUserId
 * @param {'music'|'klip'|string} [input.contentType]
 * @param {string} input.genre
 * @param {string} input.leadId
 * @param {string} [input.coverImg]
 * @param {Array<{ contentId: string, position: number }>} input.tracks
 * @returns {Promise<{
 *   token: string,
 *   contentType: string,
 *   genre: string,
 *   leadId: string,
 *   coverImg: string,
 *   tracks: Array<{ contentId: string, position: number }>,
 *   expiresAt: Date,
 * }|null>}
 */
const createMixShare = async (input) => {
  const ownerUserId = parseUserId(input?.ownerUserId);
  const contentType = normalizeMixContentType(input?.contentType);
  const genre = String(input?.genre || '').trim();
  const leadId = String(input?.leadId || '').trim();
  const coverImg = String(input?.coverImg || '').trim();
  const tracks = (input?.tracks || [])
    .map((row, index) => ({
      contentId: String(row?.contentId || '').trim(),
      position: Math.max(1, Number(row?.position) || index + 1),
    }))
    .filter((row) => row.contentId);

  if (!ownerUserId || !genre || !leadId || !tracks.length) return null;

  const ttlMs = Math.max(60 * 1000, Number(musicMixWeights.shareTtlMs) || 90 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(Date.now() + ttlMs);
  const token = makeToken();

  const doc = await MusicMixShare.create({
    token,
    ownerUserId,
    contentType,
    genre,
    leadId,
    coverImg,
    tracks,
    expiresAt,
  });

  return {
    token: doc.token,
    contentType: doc.contentType,
    genre: doc.genre,
    leadId: doc.leadId,
    coverImg: doc.coverImg || '',
    tracks: (doc.tracks || []).map((row) => ({
      contentId: row.contentId,
      position: row.position,
    })),
    expiresAt: doc.expiresAt,
  };
};

/**
 * Token bo'yicha o'qish. Muddat o'tgan yoki yo'q — null.
 * Hech kimning mixiga yozilmaydi.
 *
 * @param {string} token
 * @returns {Promise<{
 *   token: string,
 *   contentType: string,
 *   genre: string,
 *   leadId: string,
 *   coverImg: string,
 *   tracks: Array<{ contentId: string, position: number }>,
 *   expiresAt: Date,
 * }|null>}
 */
const findMixShareByToken = async (token, { allowExpired = false } = {}) => {
  const key = String(token || '').trim();
  if (!key) return null;

  const doc = await MusicMixShare.findOne({ token: key })
    .select({
      token: 1,
      ownerUserId: 1,
      contentType: 1,
      genre: 1,
      leadId: 1,
      coverImg: 1,
      tracks: 1,
      expiresAt: 1,
      _id: 0,
    })
    .lean();

  if (!doc) return null;
  const expired = Boolean(doc.expiresAt && new Date(doc.expiresAt).getTime() <= Date.now());
  if (expired && !allowExpired) return null;

  return {
    token: doc.token,
    ownerUserId: doc.ownerUserId || null,
    contentType: normalizeMixContentType(doc.contentType),
    genre: String(doc.genre || '').trim(),
    leadId: String(doc.leadId || '').trim(),
    coverImg: String(doc.coverImg || '').trim(),
    tracks: (doc.tracks || []).map((row) => ({
      contentId: String(row.contentId || '').trim(),
      position: Number(row.position) || 0,
    })),
    expiresAt: doc.expiresAt,
    expired,
  };
};

/**
 * O'qilganda TTL uzaytirish + ixtiyoriy live tracks yangilash.
 * Qabul qiluvchi mixiga yozilmaydi.
 */
const refreshMixShareDocument = async (token, patch = {}) => {
  const key = String(token || '').trim();
  if (!key) return null;

  const ttlMs = Math.max(60 * 1000, Number(musicMixWeights.shareTtlMs) || 90 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(Date.now() + ttlMs);
  const $set = { expiresAt };

  if (patch.leadId != null) $set.leadId = String(patch.leadId).trim();
  if (patch.coverImg != null) $set.coverImg = String(patch.coverImg || '').trim();
  if (Array.isArray(patch.tracks) && patch.tracks.length) {
    $set.tracks = patch.tracks
      .map((row, index) => ({
        contentId: String(row?.contentId || '').trim(),
        position: Math.max(1, Number(row?.position) || index + 1),
      }))
      .filter((row) => row.contentId);
  }

  const doc = await MusicMixShare.findOneAndUpdate(
    { token: key },
    { $set },
    { new: true }
  )
    .select({
      token: 1,
      ownerUserId: 1,
      contentType: 1,
      genre: 1,
      leadId: 1,
      coverImg: 1,
      tracks: 1,
      expiresAt: 1,
      _id: 0,
    })
    .lean();

  if (!doc) return null;

  return {
    token: doc.token,
    ownerUserId: doc.ownerUserId || null,
    contentType: normalizeMixContentType(doc.contentType),
    genre: String(doc.genre || '').trim(),
    leadId: String(doc.leadId || '').trim(),
    coverImg: String(doc.coverImg || '').trim(),
    tracks: (doc.tracks || []).map((row) => ({
      contentId: String(row.contentId || '').trim(),
      position: Number(row.position) || 0,
    })),
    expiresAt: doc.expiresAt,
    expired: false,
  };
};

/**
 * Bir egada bir janr/tur uchun aktiv share qayta ishlatiladi (spam yo'q).
 * Tracks/cover yangilanadi, token saqlanadi, TTL uzaytiriladi.
 *
 * @param {object} input
 * @returns {Promise<ReturnType<typeof createMixShare>>}
 */
const createOrRefreshMixShare = async (input) => {
  const ownerUserId = parseUserId(input?.ownerUserId);
  const contentType = normalizeMixContentType(input?.contentType);
  const genre = String(input?.genre || '').trim();
  const leadId = String(input?.leadId || '').trim();
  const coverImg = String(input?.coverImg || '').trim();
  const tracks = (input?.tracks || [])
    .map((row, index) => ({
      contentId: String(row?.contentId || '').trim(),
      position: Math.max(1, Number(row?.position) || index + 1),
    }))
    .filter((row) => row.contentId);

  if (!ownerUserId || !genre || !leadId || !tracks.length) return null;

  const ttlMs = Math.max(60 * 1000, Number(musicMixWeights.shareTtlMs) || 90 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(Date.now() + ttlMs);

  const existing = await MusicMixShare.findOne({
    ownerUserId,
    contentType,
    genre,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (existing) {
    existing.leadId = leadId;
    existing.coverImg = coverImg;
    existing.tracks = tracks;
    existing.expiresAt = expiresAt;
    await existing.save();
    return {
      token: existing.token,
      contentType: existing.contentType,
      genre: existing.genre,
      leadId: existing.leadId,
      coverImg: existing.coverImg || '',
      tracks: (existing.tracks || []).map((row) => ({
        contentId: row.contentId,
        position: row.position,
      })),
      expiresAt: existing.expiresAt,
    };
  }

  return createMixShare({
    ownerUserId,
    contentType,
    genre,
    leadId,
    coverImg,
    tracks,
  });
};

module.exports = {
  createMixShare,
  createOrRefreshMixShare,
  findMixShareByToken,
  refreshMixShareDocument,
};
