'use strict';
const createGuestTrendReader = ({ progressModel }) => async ({ fromMs, nowMs }) => ({
  sessions: await progressModel.find({ createdAt: { $gte: new Date(fromMs), $lte: new Date(nowMs) },
    updatedAt: { $lte: new Date(nowMs) } }).select({ _id: 0 }).lean(),
  actions: [], reactions: [],
});
module.exports = { createGuestTrendReader };
