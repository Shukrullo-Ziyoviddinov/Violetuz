'use strict';

const collections = require('../../../config/collections');
const { overlaps } = require('./match');

const movieType = collections.existing.shortsVideos.type;
const musicType = collections.existing.musicShorts.type;

/**
 * @param {object} doc
 * @param {object} anchor
 */
const anchorOverlap = (doc, anchor) => {
  if (doc.type === movieType) {
    return overlaps(doc.movieGenres, anchor.movieGenres)
      || overlaps(doc.movieCountries, anchor.movieCountries)
      || (anchor.franchiseMovieIds || []).some((id) => String(id) === String(doc.movieId));
  }
  return overlaps(doc.musicGenres, anchor.musicGenres)
    || overlaps(doc.musicCountries, anchor.musicCountries);
};

/**
 * @param {object} doc
 * @param {object} tops
 */
const userOverlap = (doc, tops) => {
  if (doc.type === movieType) {
    return overlaps(doc.movieGenres, tops.genres) || overlaps(doc.movieCountries, tops.countries);
  }
  return overlaps(doc.musicGenres, tops.musicGenres) || overlaps(doc.musicCountries, tops.musicCountries);
};

/**
 * Excludes the anchor. Franchise movies stay even when genres differ.
 * @param {object} ctx
 */
const collect = async (ctx) => {
  const anchor = ctx.anchor || {};
  const type = anchor.type || (anchor.kind === 'music' ? musicType : movieType);
  const filter = { type };
  if (type === movieType && anchor.movieId != null) filter.movieId = { $ne: anchor.movieId };
  if (type === musicType && anchor.musicKey) filter.musicKey = { $ne: anchor.musicKey };
  const docs = await ctx.query(filter, ctx.similarLimit || ctx.fetchLimit);
  const tops = ctx.userTops || {};
  const taste = type === movieType
    ? (tops.genres || []).length + (tops.countries || []).length
    : (tops.musicGenres || []).length + (tops.musicCountries || []).length;
  return docs.filter((doc) => {
    const franchise = doc.type === movieType
      && (anchor.franchiseMovieIds || []).some((id) => String(id) === String(doc.movieId));
    if (franchise) return true;
    if (!anchorOverlap(doc, anchor)) return false;
    if (!taste) return true;
    return userOverlap(doc, tops);
  });
};

module.exports = { collect };
