/**
 * .similar-trailers-list tartibi.
 * Kino bo‘limlarining algoritmidan alohida. Ularga yozilmaydi.
 *
 * @module similar-trailers
 */

'use strict';

const { collectMovieTrailers } = require('./catalog');
const { readTaste, readAccountTaste, readGuestTaste } = require('./taste.read');
const { closenessScore, orderByCloseness } = require('./closeness');
const { orderWatchedLower } = require('./watchedOrder');
const { mixTrailers } = require('./mix');
const { assembleSimilarTrailers } = require('./assemble');
const { serveSimilarTrailers } = require('./serve.service');
const routes = require('./routes');

module.exports = {
  collectMovieTrailers,
  readTaste,
  readAccountTaste,
  readGuestTaste,
  closenessScore,
  orderByCloseness,
  orderWatchedLower,
  mixTrailers,
  assembleSimilarTrailers,
  serveSimilarTrailers,
  routes,
};
