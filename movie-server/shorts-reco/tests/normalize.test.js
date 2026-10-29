'use strict';

const assert = require('node:assert/strict');
const collections = require('../config/collections');
const {
  toKeyList,
  genreKeysOfMovie,
  typeCategoryKeysOfMovie,
  countryKeysOfMovie,
  genreKeysOfMusic,
  countryKeysOfMusic,
  unionKeys,
  normalizeTitle,
} = require('../utils/normalize');

const movie = {
  filterGenre: ['Jangari', ' Triller ', 'Jangari'],
  filterCountry: ['USA', 'Britain'],
  typeCategory: ['action', 'thriller', 'actionMovies'],
  categoryName: 'Jangari',
  movieSauntrik: [1, 2],
  movieSauntrikVideo: [3],
  specs: { countries: ['Should Not Be Read'], languages: ['eng'] },
  genre: { uz: 'Jangari', ru: 'Боевик' },
};

assert.deepEqual(genreKeysOfMovie(movie), ['jangari', 'triller']);
assert.deepEqual(typeCategoryKeysOfMovie(movie), ['action', 'thriller', 'actionmovies']);
assert.deepEqual(countryKeysOfMovie(movie), ['usa', 'britain']);
assert.deepEqual(countryKeysOfMovie({ filterCountry: 'USA' }), ['usa']);
assert.deepEqual(genreKeysOfMovie({}), []);
assert.deepEqual(genreKeysOfMovie(null), []);
assert.deepEqual(genreKeysOfMusic({ genre: 'Electronic' }), ['electronic']);
assert.deepEqual(genreKeysOfMusic({ genre: ['Pop', 'pop', ''] }), ['pop']);
assert.deepEqual(countryKeysOfMusic({ country: 'britaniya' }), ['britaniya']);
assert.deepEqual(unionKeys(['pop'], ['rock', 'pop']), ['pop', 'rock']);
assert.equal(normalizeTitle('  Die   With A Smile '), 'die with a smile');
assert.deepEqual(toKeyList([{ uz: 'nope' }, null, 'USA']), ['usa']);

const serialized = JSON.stringify(collections);
assert.equal(serialized.includes('videoId'), false);
assert.equal(serialized.includes('description'), false);
assert.equal(serialized.includes('movieSauntrik'), false);
assert.equal(serialized.includes('categoryName'), false);
assert.equal(serialized.includes('specs'), false);
assert.equal(serialized.includes('"genre.uz"'), false);

console.log('ok normalize');
