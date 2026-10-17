/**
 * Parda ortida video foizi.
 * Kino tavsiyasi va aktyor balidan alohida.
 *
 * @module recommendation-triller
 */

'use strict';

const routes = require('./routes');
const { reportTrillerProgress, listTrillerProgress } = require('./services/progress.service');
const { readTaste, readAccountTaste, readGuestTaste, readCrowdTaste } = require('./services/taste.read');
const { orderFranchiseVideos, orderMovieVideos, gapForRowLength } = require('./services/movieOrder');
const { orderActorRotation, orderActorVideos } = require('./services/actorOrder');
const { orderGenreCountry } = require('./services/genreCountryOrder');
const { assembleTrillerRow } = require('./services/assembleRow');
const { serveTrillerList } = require('./services/serve.service');
const { crowdFade, countQualityMovies } = require('./services/crowdFade');

module.exports = {
  routes,
  reportTrillerProgress,
  listTrillerProgress,
  readTaste,
  readAccountTaste,
  readGuestTaste,
  readCrowdTaste,
  orderFranchiseVideos,
  orderMovieVideos,
  gapForRowLength,
  orderActorRotation,
  orderActorVideos,
  orderGenreCountry,
  assembleTrillerRow,
  serveTrillerList,
  crowdFade,
  countQualityMovies,
};
