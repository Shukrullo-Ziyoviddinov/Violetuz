'use strict';

const assert = require('node:assert/strict');
const collections = require('../config/collections');
const { mapShort } = require('../repositories/source/shorts.source');
const { mapTrack } = require('../repositories/source/music.source');
const { getShortRefs } = require('../services/refs.service');
const { buildCatalogRecord } = require('../services/catalogRecord');

const mappedShort = mapShort(
  {
    id: 1,
    movieId: 2,
    type: 'movieShorts',
    description: { uz: 'hidden' },
    video: { uz: '/video/shorts1.mp4' },
    musics: { musicId: 9, videoId: 8 },
    categoryName: 'nope',
  },
  collections.existing.shortsVideos,
  'movie'
);

assert.deepEqual(mappedShort, {
  role: 'movie',
  type: 'movieShorts',
  numericId: 1,
  sourceType: 'movieShorts',
  movieId: 2,
  musicId: 9,
});

const mappedTrack = mapTrack(
  {
    id: 802,
    artistId: 'jah-khalib',
    title: 'Subwoofer',
    genre: 'dubstep',
    country: 'uzbekistan',
    language: 'uzbek',
    clipId: null,
    lyricsText: 'hidden',
    fingerprint: 'hidden',
  },
  collections.existing.music
);
assert.equal(mappedTrack.language, 'uzbek');
assert.equal(mappedTrack.lyricsText, undefined);
assert.equal(mappedTrack.fingerprint, undefined);
assert.equal(mappedTrack.clipId, null);

const movie = {
  filterGenre: ['Jangari', 'Triller'],
  filterCountry: ['USA', 'Britain'],
  typeCategory: ['action', 'thriller'],
  actors: [3, '8', 3],
  franchiseMovieIds: [9, 10],
  specs: { countries: ['Uzbekistan'] },
  categoryName: 'Nope',
  movieSauntrik: [1],
  movieSauntrikVideo: [2],
};

const movieRecord = buildCatalogRecord({
  short: {
    role: 'movie',
    type: 'movieShorts',
    numericId: 1,
    movieId: 4,
    musicId: 802,
  },
  movie,
  track: {
    kind: 'music',
    id: 802,
    artistId: 'jah-khalib',
    genre: 'pop',
    country: 'usa',
    language: 'uzbek',
  },
  artist: { genres: ['rock'], country: 'france' },
  songGroupId: 'song:music:802',
});

assert.equal(movieRecord.shortId, 'movieShorts:1');
assert.equal(movieRecord.type, 'movieShorts');
assert.equal(movieRecord.contentType, null);
assert.equal(movieRecord.musicKey, 'music:802');
assert.equal(movieRecord.songGroupId, 'song:music:802');
assert.equal(movieRecord.artistId, 'jah-khalib');
assert.deepEqual(movieRecord.movieGenres, ['jangari', 'triller']);
assert.deepEqual(movieRecord.movieTypeCategories, ['action', 'thriller']);
assert.deepEqual(movieRecord.movieCountries, ['usa', 'britain']);
assert.deepEqual(movieRecord.musicGenres, ['pop']);
assert.deepEqual(movieRecord.musicCountries, ['usa']);
assert.deepEqual(movieRecord.actors, [3, 8]);
assert.deepEqual(movieRecord.franchiseMovieIds, [9, 10]);
assert.equal(movieRecord.description, undefined);
assert.equal(movieRecord.catalogAddedAt, undefined);

const noArtist = getShortRefs({
  short: { role: 'movie', type: 'movieShorts', numericId: 2, movieId: 5, musicId: 3 },
  movie: { filterCountry: 'USA' },
  track: { genre: 'pop', country: 'usa', artistId: '' },
});
assert.equal(noArtist.artistId, null);
assert.equal(noArtist.musicKey, 'music:3');
assert.equal(noArtist.linkedMovieId, null);

const musicRecord = buildCatalogRecord({
  short: {
    role: 'music',
    type: 'musicshorts',
    numericId: 10001,
    musicId: 550,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
  },
  movie: { ...movie, actors: [99] },
  track: { genre: 'pop', country: 'usa', language: 'english' },
  artist: { genres: ['Rock', 'pop'], country: 'britaniya' },
  songGroupId: null,
});

assert.equal(musicRecord.shortId, 'musicshorts:10001');
assert.equal(musicRecord.contentType, 'klip');
assert.equal(musicRecord.musicKey, 'klip:550');
assert.equal(musicRecord.movieId, 1);
assert.equal(musicRecord.artistId, 'jah-khalib');
assert.deepEqual(musicRecord.musicGenres, ['pop', 'rock']);
assert.deepEqual(musicRecord.musicCountries, ['usa', 'britaniya']);
assert.deepEqual(musicRecord.actors, []);
assert.deepEqual(musicRecord.franchiseMovieIds, []);
assert.equal(musicRecord.musicLanguage, 'english');
assert.deepEqual(musicRecord.movieGenres, ['jangari', 'triller']);

const brokenType = buildCatalogRecord({
  short: {
    role: 'music',
    type: 'musicshorts',
    numericId: 10004,
    musicId: 12,
    artistId: 'maher-zain',
    movieId: null,
    contentType: 'album',
  },
  track: { genre: 'pop', country: 'usa' },
});
assert.equal(brokenType.musicKey, null);
assert.equal(brokenType.contentType, null);
assert.equal(brokenType.shortId, 'musicshorts:10004');

const konsert = getShortRefs({
  short: {
    role: 'music',
    type: 'musicshorts',
    musicId: 12,
    artistId: 'maher-zain',
    contentType: 'konsert',
  },
});
assert.equal(konsert.musicKey, 'konsert:12');

console.log('ok refs');
