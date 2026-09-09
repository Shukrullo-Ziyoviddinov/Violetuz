/**
 * Actor watch-count store — shared entityDistinctCount + actor collections.
 *
 * @module recommendation-actors/store
 */

'use strict';

const {
  createEntityDistinctCountStore,
  createEntityDistinctCountService,
} = require('../recommendation-shared/entityDistinctCount');
const { scoringWeights } = require('./config/scoringWeights');

const store = createEntityDistinctCountStore({
  creditModelName: 'RecommendationUserActorMovieCredit',
  creditCollection: 'recommendation_user_actor_movie_credits',
  scoreModelName: 'RecommendationUserActorWatchScore',
  scoreCollection: 'recommendation_user_actor_watch_scores',
  itemIdField: 'movieId',
  entityIdField: 'actorId',
  entityIdsField: 'actorIds',
});

const service = createEntityDistinctCountService({
  store,
  logPrefix: '[recommendation-actors]',
  minScore: scoringWeights.minMovieCount,
  defaultLimit: scoringWeights.defaultLimit,
  maxLimit: scoringWeights.maxLimit,
  sourceLabel: 'actor_watch_score',
  resultKey: 'actors',
  idKey: 'actorId',
});

module.exports = {
  store,
  service,
  CreditModel: store.CreditModel,
  ScoreModel: store.ScoreModel,
};
