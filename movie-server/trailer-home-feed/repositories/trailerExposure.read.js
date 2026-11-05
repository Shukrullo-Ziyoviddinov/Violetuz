'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');

// Count UNIQUE qualified impression viewer-days, not seed views or arbitrary opens.
const createExposureReader = ({ actionModel }) => async ({ nowMs }) => {
  const config = trailerHomeFeedWeights;
  const rows = await actionModel.aggregate([
    { $match: { type: 'impression', occurredAt: {
      $gte: new Date(nowMs - config.candidates.exploration.exposureWindowDays * 86400_000), $lte: new Date(nowMs),
    }, visibleRatio: { $gte: config.engagement.impression.minVisibleRatio, $lte: 1 },
    visibleMs: { $gte: config.engagement.impression.minVisibleMs } } },
    { $group: { _id: { movieId: '$movieId', trailerId: '$trailerId', userId: '$userId',
      day: { $dateToString: { date: '$occurredAt', format: '%Y-%m-%d', timezone: 'UTC' } } } } },
    { $group: { _id: { movieId: '$_id.movieId', trailerId: '$_id.trailerId' }, viewerDays: { $sum: 1 } } },
  ]);
  return { available: true, scope: 'account-impressions', generatedAt: new Date(nowMs).toISOString(), rows: rows.map((row) => ({
    key: `${row._id.movieId}-${row._id.trailerId}`, viewerDays: row.viewerDays,
  })) };
};

module.exports = { createExposureReader };
