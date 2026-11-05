'use strict';

// Date predicates use server receipt timestamps, not cumulative progress updatedAt.
const createTrendReader = ({ actionModel, progressModel, reactionModel }) => async ({ fromMs, nowMs, catalog }) => {
  const range = { $gte: new Date(fromMs), $lte: new Date(nowMs) };
  const [actions, sessions, reactions] = await Promise.all([
    actionModel.find({ occurredAt: range }).select({ _id: 0 }).lean(),
    progressModel.find({ createdAt: range, updatedAt: { $lte: new Date(nowMs) } }).select({ _id: 0 }).lean(),
    reactionModel.find({ type: 'movieTriller', updatedAt: range, targetId: { $in: catalog.map((row) => row.key) } })
      .select({ _id: 0, userId: 1, type: 1, targetId: 1, value: 1, updatedAt: 1 }).lean(),
  ]);
  return { actions, sessions, reactions };
};

module.exports = { createTrendReader };
