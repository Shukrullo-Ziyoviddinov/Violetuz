'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');

const createPersonalTasteReader = ({ actionModel, trailerProgressModel, reactionModel, movieAffinityModel, movieProgressModel }) =>
  async (userId, { nowMs }) => {
    const policy = trailerHomeFeedWeights.personalization;
    const range = { $gte: new Date(nowMs - policy.historyMaxAgeDays * 86400_000), $lte: new Date(nowMs) };
    const read = (Model, query, projection) => Model.find({ userId, ...query }).select({ _id: 0, ...projection }).lean();
    const [actions, sessions, reactions, affinities, movieProgress, movieLikes] = await Promise.all([
      read(actionModel, { occurredAt: range }),
      read(trailerProgressModel, { createdAt: range, updatedAt: { $lte: new Date(nowMs) } }),
      read(reactionModel, { type: 'movieTriller', updatedAt: range }),
      read(movieAffinityModel, { dimensionType: { $in: ['genre', 'country', 'actor', 'genre_country', 'genre_actor'] }, updatedAt: range },
        { userId: 1, dimensionType: 1, dimensionValue: 1, affinityScore: 1, updatedAt: 1 }),
      read(movieProgressModel, { updatedAt: range, watchedSeconds: { $gte: policy.movieTastePrior.minWatchedSeconds }, completionRate: { $gte: policy.movieTastePrior.minCompletion } },
        { userId: 1, movieId: 1, watchedSeconds: 1, completionRate: 1, updatedAt: 1 }),
      read(reactionModel, { type: 'movie', value: 'like', updatedAt: range },
        { userId: 1, type: 1, targetId: 1, value: 1, updatedAt: 1 }),
    ]);
    return { actions, sessions, reactions, affinities, movieProgress, movieLikes };
  };

module.exports = { createPersonalTasteReader };
