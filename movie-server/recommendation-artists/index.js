/**
 * Recommended artists engine (isolated from music affinity / scoring).
 *
 * Mount: /api/recommended-artists
 *
 * Collections (music_ prefix — never writes recommendation_user_actor_*):
 *   music_recommendation_user_artist_content_credits
 *   music_recommendation_user_artist_watch_scores
 *
 * "Tinglandi" gate: recommendation-music progress (≥10s).
 * +1 from content.artistId once per contentKey (music|clip|concert|album).
 * Shared counting core: recommendation-shared/entityDistinctCount
 *
 * @module recommendation-artists
 */

'use strict';

const { scoringWeights } = require('./config/scoringWeights');
const { store, service } = require('./store');
const services = require('./services');
const routes = require('./routes');

module.exports = {
  routes,
  scoringWeights,
  store,
  service,
  services,
  applyCreditsFromListenedContent: services.applyCreditsFromListenedContent,
  getRecommendedArtists: services.getRecommendedArtists,
};
