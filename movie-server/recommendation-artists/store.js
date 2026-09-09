/**
 * Artist watch-count store — shared core + music_* collections.
 *
 * Score = distinct contentKeys (music/clip/concert/album) with this artistId.
 * Same artist across types stacks (music + clip → 2).
 *
 * @module recommendation-artists/store
 */

'use strict';

const {
  createEntityDistinctCountStore,
  createEntityDistinctCountService,
} = require('../recommendation-shared/entityDistinctCount');
const { scoringWeights } = require('./config/scoringWeights');

const store = createEntityDistinctCountStore({
  creditModelName: 'MusicRecommendationUserArtistContentCredit',
  creditCollection: 'music_recommendation_user_artist_content_credits',
  scoreModelName: 'MusicRecommendationUserArtistWatchScore',
  scoreCollection: 'music_recommendation_user_artist_watch_scores',
  itemIdField: 'contentKey',
  entityIdField: 'artistId',
  entityIdsField: 'artistIds',
});

const service = createEntityDistinctCountService({
  store,
  logPrefix: '[recommendation-artists]',
  minScore: scoringWeights.minContentCount,
  defaultLimit: scoringWeights.defaultLimit,
  maxLimit: scoringWeights.maxLimit,
  sourceLabel: 'artist_watch_score',
  resultKey: 'artists',
  idKey: 'artistId',
});

module.exports = {
  store,
  service,
  CreditModel: store.CreditModel,
  ScoreModel: store.ScoreModel,
};
