'use strict';
const { mergeSessionProgress } = require('../progress/progressProtocol');
const { createHttpError } = require('../../utils/errors');

const createProgressRepository = (Model) => ({
  async save(userId, report) {
    const identity = { userId, movieId: report.movieId, trailerId: report.trailerId, sessionId: report.sessionId };
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const previous = await Model.findOne(identity).lean();
      const merged = mergeSessionProgress(previous, report);
      const values = { durationSec: merged.durationSec, intervals: merged.intervals,
        realWatchedSeconds: merged.realWatchedSeconds, totalPlayedSeconds: merged.totalPlayedSeconds };
      if (!previous) {
        try {
          await Model.create({ ...identity, ...values, version: 0 });
          return { progress: merged, changed: true };
        } catch (error) {
          if (error.code === 11000) continue;
          throw error;
        }
      }
      if (previous.totalPlayedSeconds === merged.totalPlayedSeconds
        && previous.realWatchedSeconds === merged.realWatchedSeconds
        && JSON.stringify(previous.intervals) === JSON.stringify(merged.intervals)) {
        return { progress: merged, changed: false };
      }
      const updated = await Model.findOneAndUpdate({ ...identity, version: previous.version },
        { $set: values, $inc: { version: 1 } }, { new: true, runValidators: true }).lean();
      if (updated) return { progress: merged, changed: true };
    }
    throw createHttpError(409, 'Progress changed concurrently; retry the same snapshot');
  },
  list(userId, movieId, trailerId) {
    return Model.find({ userId, movieId, trailerId }).select({ _id: 0, userId: 0, __v: 0 }).sort({ createdAt: 1 }).lean();
  },
});

module.exports = { createProgressRepository };
