'use strict';

const config = require('../config');
const collections = require('../config/collections');
const { musicKey, blankToNull } = require('../utils/keys');
const {
  genreKeysOfMovie,
  countryKeysOfMovie,
  genreKeysOfMusic,
  countryKeysOfMusic,
  unionKeys,
  toKeyList,
} = require('../utils/normalize');

const allowedContentTypes = new Set(config.contentTypes);
const musicKind = collections.existing.music.kind;

/**
 * @param {{
 *   short: object,
 *   movie?: object|null,
 *   track?: object|null,
 *   artist?: object|null,
 *   songGroupId?: string|null,
 * }} input
 */
const getShortRefs = (input) => {
  const short = input.short || {};
  const movie = input.movie || null;
  const track = input.track || null;
  const artist = input.artist || null;
  const movieGenres = genreKeysOfMovie(movie);
  const movieCountries = countryKeysOfMovie(movie);

  if (short.role === 'movie' || short.type === collections.existing.shortsVideos.type) {
    const key = musicKey(musicKind, short.musicId);
    return {
      type: collections.existing.shortsVideos.type,
      movieId: short.movieId == null ? null : short.movieId,
      musicKey: key,
      songGroupId: input.songGroupId || null,
      artistId: track && track.artistId ? track.artistId : null,
      movieGenres,
      movieCountries,
      musicGenres: genreKeysOfMusic(track),
      musicCountries: countryKeysOfMusic(track),
      linkedMovieId: null,
    };
  }

  const contentType = allowedContentTypes.has(short.contentType) ? short.contentType : null;
  const key = contentType ? musicKey(contentType, short.musicId) : null;

  return {
    type: collections.existing.musicShorts.type,
    movieId: null,
    musicKey: key,
    songGroupId: key ? input.songGroupId || null : null,
    artistId: blankToNull(short.artistId),
    movieGenres,
    movieCountries,
    musicGenres: unionKeys(genreKeysOfMusic(track), toKeyList(artist && artist.genres)),
    musicCountries: unionKeys(countryKeysOfMusic(track), toKeyList(artist && artist.country)),
    linkedMovieId: short.movieId == null ? null : short.movieId,
  };
};

module.exports = {
  getShortRefs,
};
