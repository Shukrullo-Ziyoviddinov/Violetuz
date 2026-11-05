'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');

const createRepetitionReader = ({ progressModel, actionModel, reactionModel }) => async (userId, { nowMs }) => {
  const config = trailerHomeFeedWeights;
  const [sessions, actions, reactions] = await Promise.all([
    progressModel.find({ userId, createdAt: { $gte: new Date(nowMs - config.personalization.historyMaxAgeDays * 86400_000), $lte: new Date(nowMs) },
      updatedAt: { $lte: new Date(nowMs) } }).select({ _id: 0 }).lean(),
    actionModel.find({ userId, type: 'impression', occurredAt: {
      $gte: new Date(nowMs - config.repetition.impressionLookbackHours * 3600_000), $lte: new Date(nowMs),
    } }).select({ _id: 0 }).lean(),
    reactionModel.find({ userId, type: 'movieTriller', updatedAt: {
      $gte: new Date(nowMs - config.repetition.dislikedCooldownDays * 86400_000), $lte: new Date(nowMs),
    } }).select({ _id: 0 }).lean(),
  ]);
  return { sessions, actions, reactions };
};

module.exports = { createRepetitionReader };
