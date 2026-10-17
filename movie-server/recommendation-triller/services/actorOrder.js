/**
 * Aktyor videolarining tartibi. Sof hisob, bazaga yozmaydi.
 *
 * Ikki turli kinodan keyin kiradi.
 * Ichida: ko‘rilmagan, keyin kam foiz, keyin ko‘p foiz. Foiz teng bo‘lsa, yangisi oldinda.
 * Keyin ball navbati: eng ko‘p kinoli aktyor, keyin keyingisi.
 * Bitta video eng yuqori balli aktyorda bir marta turadi.
 *
 * @module recommendation-triller/services/actorOrder
 */

'use strict';

const { gapForRowLength } = require('./movieOrder');

const MIN_ACTOR_MOVIES = 2;

const completionOf = (completionById, videoId) => {
  const rate = Number(completionById?.[videoId] ?? completionById?.[String(videoId)]);
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return Math.min(1, rate);
};

const publishedAt = (video) => {
  const raw = video?.publishedAt ?? video?.createdAt ?? null;
  if (raw == null || raw === '') return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
};

const actorIdsOf = (video) => {
  const source = Array.isArray(video?.actors) ? video.actors : [];
  const seen = new Set();
  const ids = [];
  for (const raw of source) {
    const id = String(raw ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
};

/**
 * @param {Array<{ actorId: string|number, score: number }>} actors
 * @returns {Array<{ actorId: string, score: number }>}
 */
const qualifiedActors = (actors) =>
  (Array.isArray(actors) ? actors : [])
    .map((row) => ({
      actorId: String(row?.actorId ?? '').trim(),
      score: Number(row?.score) || 0,
    }))
    .filter((row) => row.actorId && row.score >= MIN_ACTOR_MOVIES)
    .sort((a, b) => b.score - a.score || a.actorId.localeCompare(b.actorId));

/**
 * @param {Array<Object>} videos
 * @param {Object.<string|number, number>} completionById
 */
const orderActorVideos = (videos, completionById) =>
  [...(Array.isArray(videos) ? videos : [])]
    .filter((video) => video && video.id != null)
    .sort((a, b) => {
      const rateDelta = completionOf(completionById, a.id) - completionOf(completionById, b.id);
      if (rateDelta !== 0) return rateDelta;
      const timeDelta = publishedAt(b) - publishedAt(a);
      if (timeDelta !== 0) return timeDelta;
      return Number(a.id) - Number(b.id);
    });

/**
 * @param {Object} video
 * @param {Array<{ actorId: string, score: number }>} ranked
 * @returns {string|null}
 */
const ownerActorId = (video, ranked) => {
  const onVideo = new Set(actorIdsOf(video));
  for (const actor of ranked) {
    if (onVideo.has(actor.actorId)) return actor.actorId;
  }
  return null;
};

/**
 * @param {Object} [input]
 * @param {Array<{ id: *, actors?: Array<string|number>, publishedAt?: *, createdAt?: * }>} [input.videos]
 * @param {Array<{ actorId: string|number, score: number }>} [input.actors]
 * @param {Object.<string|number, number>} [input.completionById]
 * @param {number} [input.rowLength]
 * @returns {{
 *   lanes: Array<{ actorId: string, score: number, videos: Object[] }>,
 *   order: Array<{ video: Object, actorId: string, round: number, at: number }>,
 *   gap: number,
 *   minMovies: number
 * }}
 */
const orderActorRotation = (input = {}) => {
  const videos = Array.isArray(input.videos) ? input.videos : [];
  const completionById = input.completionById || {};
  const ranked = qualifiedActors(input.actors);
  const gap = gapForRowLength(input.rowLength != null ? input.rowLength : videos.length);

  /** @type {Map<string, Object[]>} */
  const buckets = new Map();
  for (const video of videos) {
    if (!video || video.id == null) continue;
    const owner = ownerActorId(video, ranked);
    if (!owner) continue;
    if (!buckets.has(owner)) buckets.set(owner, []);
    buckets.get(owner).push(video);
  }

  const lanes = ranked
    .map((actor) => ({
      actorId: actor.actorId,
      score: actor.score,
      videos: orderActorVideos(buckets.get(actor.actorId) || [], completionById),
    }))
    .filter((lane) => lane.videos.length > 0);

  /** @type {Array<{ video: Object, actorId: string, round: number, at: number }>} */
  const order = [];
  const seen = new Set();
  const rounds = lanes.reduce((max, lane) => Math.max(max, lane.videos.length), 0);

  for (let round = 0; round < rounds; round += 1) {
    for (const lane of lanes) {
      const video = lane.videos[round];
      if (!video || seen.has(video.id)) continue;
      seen.add(video.id);
      order.push({
        video,
        actorId: lane.actorId,
        round,
        at: order.length * gap,
      });
    }
  }

  return {
    lanes,
    order,
    gap,
    minMovies: MIN_ACTOR_MOVIES,
  };
};

module.exports = {
  MIN_ACTOR_MOVIES,
  qualifiedActors,
  orderActorVideos,
  orderActorRotation,
};
