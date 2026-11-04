/**
 * Qidiruv shortslari — alohida qator.
 * Matn balli searchAlgorithm da qoladi. Bu fayl faqat allaqachon topilgan
 * kino / musiqa / klip / konsert id lariga shortsni yopishtiradi.
 * Tavsiya va yangi solishtirish yo'q.
 * channelId berilsa faqat shu kanal shortslari yopishtiriladi.
 */

'use strict';

const ShortVideo = require('../models/ShortVideo.model');
const MusicShort = require('../models/MusicShort.model');
const { parseContentType, getContentTypes } = require('../utils/searchContentType');

const DISPLAY_CAP = 40;
const KIND_ORDER = ['movie', 'clip', 'concert', 'music'];

const idsOf = (list) => {
  const out = [];
  const seen = new Set();
  for (const item of Array.isArray(list) ? list : []) {
    const n = Number(item?.id);
    if (!Number.isFinite(n) || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
};

const parentIndex = (ids) => {
  const map = new Map();
  ids.forEach((id, index) => map.set(id, index));
  return map;
};

const byParentThenId = (rows, index) =>
  [...rows].sort((a, b) => {
    const pa = index.get(a.parentId);
    const pb = index.get(b.parentId);
    const ai = pa == null ? Number.MAX_SAFE_INTEGER : pa;
    const bi = pb == null ? Number.MAX_SAFE_INTEGER : pb;
    if (ai !== bi) return ai - bi;
    return Number(a.id) - Number(b.id);
  });

const mixLanes = (lanes) => {
  const queues = lanes.map((lane) => lane.slice());
  const total = queues.reduce((sum, lane) => sum + lane.length, 0);
  const out = [];
  while (out.length < total) {
    let moved = false;
    for (const queue of queues) {
      if (!queue.length) continue;
      out.push(queue.shift());
      moved = true;
    }
    if (!moved) break;
  }
  return out;
};

/**
 * Bitta tur so'ralgan bo'lsa shu tur yuqorida, qolgani pastda.
 * Tur tanlanmagan yoki bir nechta tur teng so'ralgan bo'lsa aralash.
 *
 * @param {Record<string, object[]>} lanes
 * @param {string[]} preferred
 */
const orderSearchShorts = (lanes, preferred) => {
  const present = KIND_ORDER.filter((kind) => (lanes[kind] || []).length);
  const asked = (preferred || []).filter((kind) => present.includes(kind));

  if (asked.length === 1) {
    const lead = lanes[asked[0]];
    const rest = present.filter((kind) => kind !== asked[0]).map((kind) => lanes[kind]);
    return [...lead, ...rest.flat()];
  }

  if (asked.length > 1) {
    const lead = mixLanes(asked.map((kind) => lanes[kind]));
    const rest = present.filter((kind) => !asked.includes(kind)).map((kind) => lanes[kind]);
    return [...lead, ...rest.flat()];
  }

  return mixLanes(present.map((kind) => lanes[kind]));
};

const preferredKinds = (query) => {
  const parsed = parseContentType(query);
  if (!parsed.hasTypeFilter) return [];
  return getContentTypes(parsed)
    .map((type) => (type === 'clip' ? 'clip' : type))
    .filter((type) => KIND_ORDER.includes(type));
};

const toClient = (row) => ({
  id: row.id,
  type: row.type,
  video: row.video || { uz: '', ru: '' },
  parentKind: row.parentKind,
  parentId: row.parentId,
});

const attachSearchShorts = async (query, ranked, channelId = '') => {
  const channel = String(channelId || '').trim();
  const movieIds = idsOf(ranked?.movies);
  const musicIds = idsOf(ranked?.music);
  const clipIds = idsOf(ranked?.clips);
  const concertIds = idsOf(ranked?.concerts);
  if (!movieIds.length && !musicIds.length && !clipIds.length && !concertIds.length) {
    return [];
  }

  const scoped = (clause) => (channel ? { ...clause, channelId: channel } : clause);
  const musicOr = [];
  if (musicIds.length) musicOr.push(scoped({ contentType: 'music', musicId: { $in: musicIds } }));
  if (clipIds.length) musicOr.push(scoped({ contentType: 'klip', musicId: { $in: clipIds } }));
  if (concertIds.length) musicOr.push(scoped({ contentType: 'konsert', musicId: { $in: concertIds } }));

  const [movieDocs, musicDocs] = await Promise.all([
    movieIds.length
      ? ShortVideo.find(scoped({ movieId: { $in: movieIds } }))
        .select({ id: 1, video: 1, movieId: 1, type: 1, _id: 0 })
        .lean()
      : [],
    musicOr.length
      ? MusicShort.find({ $or: musicOr })
        .select({ id: 1, video: 1, musicId: 1, contentType: 1, type: 1, _id: 0 })
        .lean()
      : [],
  ]);

  const movieRank = parentIndex(movieIds);
  const musicRank = parentIndex(musicIds);
  const clipRank = parentIndex(clipIds);
  const concertRank = parentIndex(concertIds);
  const seen = new Set();

  const pushUnique = (list, row) => {
    const key = `${row.type}:${row.id}`;
    if (row.id == null || seen.has(key)) return;
    seen.add(key);
    list.push(row);
  };

  const movieRows = [];
  for (const doc of movieDocs || []) {
    const parentId = Number(doc.movieId);
    if (!movieRank.has(parentId)) continue;
    pushUnique(movieRows, {
      id: doc.id,
      type: doc.type || 'movieShorts',
      video: doc.video,
      parentKind: 'movie',
      parentId,
    });
  }

  const musicRows = [];
  const clipRows = [];
  const concertRows = [];
  for (const doc of musicDocs || []) {
    const parentId = Number(doc.musicId);
    if (!Number.isFinite(parentId)) continue;
    const kind = doc.contentType === 'klip'
      ? 'clip'
      : doc.contentType === 'konsert'
        ? 'concert'
        : doc.contentType === 'music'
          ? 'music'
          : '';
    const rank = kind === 'clip' ? clipRank : kind === 'concert' ? concertRank : musicRank;
    if (!kind || !rank.has(parentId)) continue;
    const row = {
      id: doc.id,
      type: doc.type || 'musicshorts',
      video: doc.video,
      parentKind: kind,
      parentId,
    };
    if (kind === 'clip') pushUnique(clipRows, row);
    else if (kind === 'concert') pushUnique(concertRows, row);
    else pushUnique(musicRows, row);
  }

  const lanes = {
    movie: byParentThenId(movieRows, movieRank),
    clip: byParentThenId(clipRows, clipRank),
    concert: byParentThenId(concertRows, concertRank),
    music: byParentThenId(musicRows, musicRank),
  };

  return orderSearchShorts(lanes, preferredKinds(query)).slice(0, DISPLAY_CAP).map(toClient);
};

module.exports = {
  attachSearchShorts,
  orderSearchShorts,
};
