/**
 * Parda qatorini yig‘adi. Sof hisob, bazaga yozmaydi.
 *
 * 1–2-o‘rin: yangi ko‘rilgan kinolarning asosiy videosi.
 * Keyin aktyor navbati oraliq bilan.
 * Qolgan joy janr va davlat. Har bir video bir marta.
 *
 * @module recommendation-triller/services/assembleRow
 */

'use strict';

const { gapForRowLength, orderFranchiseVideos } = require('./movieOrder');
const { orderActorRotation } = require('./actorOrder');
const { orderGenreCountry } = require('./genreCountryOrder');

const videoKey = (video) => String(video?.id);

const passesAge = (video, userAge) => {
  if (userAge == null || userAge === '') return true;
  const age = Number(userAge);
  if (!Number.isFinite(age)) return true;
  const limit = Number(video?.ageLimit);
  if (!Number.isFinite(limit) || limit <= 0) return true;
  return age >= limit;
};

const uniqueVideos = (videos) => {
  const seen = new Set();
  const list = [];
  for (const video of videos || []) {
    if (!video || video.id == null) continue;
    const key = videoKey(video);
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(video);
  }
  return list;
};

const nextFree = (slots, from) => {
  for (let index = Math.max(0, from); index < slots.length; index += 1) {
    if (!slots[index]) return index;
  }
  return -1;
};

/**
 * @param {Object} [input]
 * @param {Array<Object>} [input.videos]
 * @param {Object.<string|number, number>} [input.completionById]
 * @param {Array<{ movieId: number, watchedAt?: number|string|Date }>} [input.recentMovies]
 * @param {{ genres?: Array, countries?: Array, actors?: Array, fade?: { mode?: string }, crowdFill?: { genres?: Array, countries?: Array } }} [input.taste]
 * @param {number} [input.userAge]
 * @param {number} [input.rowLength]
 * @param {number} [input.nowMs]
 * @param {number} [input.seatMaxAgeMs]
 * @returns {{ order: Object[], kinds: string[], gap: number }}
 */
const assembleTrillerRow = (input = {}) => {
  const taste = input.taste && input.taste.ok !== false ? input.taste : {};
  const eligible = uniqueVideos(input.videos).filter((video) => passesAge(video, input.userAge));
  const rowLength = input.rowLength != null ? input.rowLength : eligible.length;
  const gap = gapForRowLength(rowLength);
  const completionById = input.completionById || {};

  const franchise = orderFranchiseVideos({
    videos: eligible,
    completionById,
    recentMovies: input.recentMovies,
    rowLength,
    nowMs: input.nowMs,
    seatMaxAgeMs: input.seatMaxAgeMs,
  });

  /** @type {Array<{ video: Object, kind: string }|null>} */
  const slots = Array.from({ length: eligible.length }, () => null);
  const used = new Set();

  const occupy = (index, video, kind) => {
    if (!video || video.id == null || used.has(videoKey(video))) return false;
    if (index < 0 || index >= slots.length || slots[index]) return false;
    slots[index] = { video, kind };
    used.add(videoKey(video));
    return true;
  };

  franchise.seats.forEach((video, index) => {
    if (video) occupy(index, video, 'seat');
  });

  for (const extra of franchise.extras) {
    const index = nextFree(slots, extra.at);
    if (index >= 0) occupy(index, extra.video, 'extra');
  }

  const actorPack = orderActorRotation({
    videos: eligible.filter((video) => !used.has(videoKey(video))),
    actors: taste.actors,
    completionById,
    rowLength,
  });

  const seated = franchise.seats.filter(Boolean).length;
  let actorCursor = seated === 0 ? 0 : gap;
  /** @type {Array<{ video: Object }>} */
  const actorLater = [];

  for (const item of actorPack.order) {
    const index = nextFree(slots, actorCursor);
    if (index < 0) {
      actorLater.push(item);
      continue;
    }
    occupy(index, item.video, 'actor');
    actorCursor = index + gap;
  }

  if (actorLater.length) {
    const holes = [];
    for (let index = 0; index < slots.length; index += 1) {
      if (!slots[index]) holes.push(index);
    }
    const tail = holes.slice(-actorLater.length);
    actorLater.forEach((item, index) => {
      if (tail[index] == null) return;
      occupy(tail[index], item.video, 'actor');
    });
  }

  const useCrowdFill = taste.fade?.mode === 'gaps' && taste.crowdFill;
  const genrePack = orderGenreCountry({
    videos: eligible,
    genres: taste.genres,
    countries: taste.countries,
    fillGenres: useCrowdFill ? taste.crowdFill.genres : undefined,
    fillCountries: useCrowdFill ? taste.crowdFill.countries : undefined,
    rowLength,
    userAge: input.userAge,
    excludeIds: [...used],
  });

  let genreIndex = 0;
  for (let index = 0; index < slots.length; index += 1) {
    if (slots[index]) continue;
    const video = genrePack.order[genreIndex];
    genreIndex += 1;
    if (!video) continue;
    occupy(index, video, 'genre');
  }

  for (const video of eligible) {
    if (used.has(videoKey(video))) continue;
    slots.push({ video, kind: 'genre' });
    used.add(videoKey(video));
  }

  const placed = slots.filter(Boolean);
  return {
    order: placed.map((slot) => slot.video),
    kinds: placed.map((slot) => slot.kind),
    gap,
  };
};

module.exports = {
  assembleTrillerRow,
};
