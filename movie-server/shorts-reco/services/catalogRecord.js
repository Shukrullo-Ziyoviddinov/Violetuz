'use strict';

const collections = require('../config/collections');
const { shortCatalogId, uniqueIds, blankToNull } = require('../utils/keys');
const { typeCategoryKeysOfMovie } = require('../utils/normalize');
const { getShortRefs } = require('./refs.service');

/**
 * One reco_short_catalog document. catalogAddedAt is applied on insert by the repo.
 * Actors and franchise ids are stored for movieShorts only.
 * @param {{
 *   short: object,
 *   movie?: object|null,
 *   track?: object|null,
 *   artist?: object|null,
 *   songGroupId?: string|null,
 * }} input
 * @returns {object|null}
 */
const buildCatalogRecord = (input) => {
  const short = input.short;
  if (!short) return null;

  const refs = getShortRefs(input);
  const shortId = shortCatalogId(refs.type, short.numericId);
  if (!shortId) return null;

  const isMovie = refs.type === collections.existing.shortsVideos.type;
  const movie = input.movie || null;
  const track = input.track || null;

  return {
    shortId,
    type: refs.type,
    contentType: isMovie ? null : refs.musicKey ? short.contentType : null,
    movieId: isMovie ? refs.movieId : refs.linkedMovieId,
    musicKey: refs.musicKey,
    songGroupId: refs.songGroupId,
    artistId: refs.artistId,
    movieGenres: refs.movieGenres,
    movieTypeCategories: typeCategoryKeysOfMovie(movie),
    movieCountries: refs.movieCountries,
    musicGenres: refs.musicGenres,
    musicCountries: refs.musicCountries,
    musicLanguage: track && track.language ? blankToNull(track.language) : null,
    actors: isMovie ? uniqueIds(movie && movie.actors) : [],
    franchiseMovieIds: isMovie
      ? uniqueIds(movie && movie.franchiseMovieIds).filter((id) => typeof id === 'number')
      : [],
  };
};

module.exports = {
  buildCatalogRecord,
};
