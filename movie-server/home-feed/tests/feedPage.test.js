'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sliceFeedPage } = require('../services/feedPage');

const catalog = {
  1: {
    id: 1,
    title: { uz: 'Bir', ru: 'Один' },
    homeImg: { uz: '/1.jpg', ru: '/1.jpg' },
    category: 'Jangari',
    rating: 4.2,
    ageRestriction: 16,
    filterGenre: ['Jangari', 'Triller'],
    specs: { year: 2020, countries: ['USA', ''] },
  },
  2: {
    id: 2,
    title: { uz: 'Ikki', ru: 'Два' },
    homeImg: { uz: '/2.jpg', ru: '/2.jpg' },
    category: 'anonslar',
    rating: 0,
    ageRestriction: null,
    filterGenre: ['Drama'],
    specs: { year: 2024, countries: ['Korea'] },
  },
  3: {
    id: 3,
    title: { uz: 'Uch', ru: 'Три' },
    homeImg: { uz: '/3.jpg', ru: '/3.jpg' },
    category: 'Drama',
    rating: 3.1,
    ageRestriction: 12,
    filterGenre: ['Drama', 'Jangari'],
    specs: { year: 2019, countries: ['Uzbekistan'] },
  },
  4: {
    id: 4,
    title: { uz: 'Tort', ru: 'Четыре' },
    homeImg: { uz: '/4.jpg', ru: '/4.jpg' },
    category: 'Komediya',
    rating: 5,
    ageRestriction: 6,
    filterGenre: ['Komediya'],
    specs: { year: 2021, countries: ['France'] },
  },
};

const feed = [1, 2, 3, 4].map((id) => ({ movieId: String(id), score: 10 - id }));

const readersFor = (calls) => ({
  findFeedPageGenresByIds: async (ids) => {
    calls.genres.push(ids.map(String));
    return ids.map((id) => catalog[String(id)]).filter(Boolean);
  },
  findFeedPageCardsByIds: async (ids) => {
    calls.cards.push(ids.map(String));
    return ids.map((id) => catalog[String(id)]).filter(Boolean).reverse();
  },
});

test('offset 0 limit 2 returns two cards and the next call continues', async () => {
  const calls = { genres: [], cards: [] };
  const readers = readersFor(calls);
  const first = await sliceFeedPage(feed, { offset: 0, limit: 2 }, readers);

  assert.equal(first.movies.length, 2);
  assert.equal(first.nextOffset, 2);
  assert.equal(first.hasMore, true);
  assert.deepEqual(first.movies.map((movie) => movie.movieId), ['1', '2']);
  assert.deepEqual(first.movies[0], {
    movieId: '1',
    id: 1,
    title: { uz: 'Bir', ru: 'Один' },
    homeImg: { uz: '/1.jpg', ru: '/1.jpg' },
    category: 'Jangari',
    rating: 4.2,
    ageRestriction: 16,
    specs: { year: 2020, countries: ['USA'] },
    filterGenre: ['Jangari', 'Triller'],
  });
  assert.equal(first.movies[1].category, 'anonslar');
  assert.deepEqual(first.genres, ['Jangari', 'Triller', 'Drama', 'Komediya']);
  assert.deepEqual(calls.cards, [['1', '2']]);
  assert.equal(first.movies[0].score, undefined);

  const second = await sliceFeedPage(feed, { offset: first.nextOffset, limit: 2 }, readers);
  assert.deepEqual(second.movies.map((movie) => movie.id), [3, 4]);
  assert.equal(second.nextOffset, 4);
  assert.equal(second.hasMore, false);
  assert.deepEqual(calls.cards[1], ['3', '4']);
});

test('genre filter keeps feed order and still pages with nextOffset', async () => {
  const calls = { genres: [], cards: [] };
  const page = await sliceFeedPage(
    feed,
    { offset: 0, limit: 1, genre: 'Drama' },
    readersFor(calls)
  );
  assert.deepEqual(page.movies.map((movie) => movie.movieId), ['2']);
  assert.equal(page.nextOffset, 1);
  assert.equal(page.hasMore, true);
  assert.deepEqual(calls.cards, [['2']]);

  const next = await sliceFeedPage(
    feed,
    { offset: page.nextOffset, limit: 1, genre: 'Drama' },
    readersFor(calls)
  );
  assert.deepEqual(next.movies.map((movie) => movie.movieId), ['3']);
  assert.equal(next.nextOffset, 2);
  assert.equal(next.hasMore, false);
});
