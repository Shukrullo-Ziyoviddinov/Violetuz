'use strict';

const collections = require('../../../config/collections');

const movieType = collections.existing.shortsVideos.type;
const musicType = collections.existing.musicShorts.type;

/**
 * @param {unknown[]} genres
 * @param {unknown[]} countries
 * @param {string} genreField
 * @param {string} countryField
 */
const tasteFilter = (genres, countries, genreField, countryField) => {
  const or = [];
  if (genres.length) or.push({ [genreField]: { $in: genres } });
  if (countries.length) or.push({ [countryField]: { $in: countries } });
  return or;
};

/**
 * From a movie anchor: music by key, song group, artist, then genre or country.
 * From a music anchor: movie shorts on that music, else the user's movie taste.
 * @param {object} ctx
 */
const collect = async (ctx) => {
  const anchor = ctx.anchor || {};
  const tops = ctx.userTops || {};
  if (ctx.step === 'musicKey') {
    if (!anchor.musicKey) return [];
    return ctx.query({ type: musicType, musicKey: anchor.musicKey }, ctx.fetchLimit);
  }
  if (ctx.step === 'songGroup') {
    if (!anchor.songGroupId) return [];
    return ctx.query({ type: musicType, songGroupId: anchor.songGroupId }, ctx.fetchLimit);
  }
  if (ctx.step === 'artist') {
    if (!anchor.artistId) return [];
    return ctx.query({ type: musicType, artistId: anchor.artistId }, ctx.fetchLimit);
  }
  if (ctx.step === 'musicTaste') {
    const or = tasteFilter(anchor.musicGenres || [], anchor.musicCountries || [], 'musicGenres', 'musicCountries');
    if (!or.length) return [];
    return ctx.query({ type: musicType, $or: or }, ctx.fetchLimit);
  }
  if (ctx.step === 'movieMusic') {
    const or = [];
    if (anchor.musicKey) or.push({ musicKey: anchor.musicKey });
    if (anchor.songGroupId) or.push({ songGroupId: anchor.songGroupId });
    if (!or.length) return [];
    return ctx.query({ type: movieType, $or: or }, ctx.fetchLimit);
  }
  if (ctx.step === 'movieTaste') {
    const or = tasteFilter(tops.genres || [], tops.countries || [], 'movieGenres', 'movieCountries');
    if (!or.length) return [];
    return ctx.query({ type: movieType, $or: or }, ctx.fetchLimit);
  }
  return [];
};

module.exports = { collect };
