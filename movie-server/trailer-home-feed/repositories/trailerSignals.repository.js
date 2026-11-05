'use strict';

const createSignalsRepository = ({ actionModel, reactionModel, progressModel }) => ({
  async record(userId, action, day, occurredAt) {
    const identity = { userId, eventId: action.eventId };
    try {
      const result = await actionModel.updateOne(identity, { $setOnInsert: { ...identity, ...action, day, occurredAt } }, { upsert: true, runValidators: true });
      return { changed: Boolean(result.upsertedCount) };
    } catch (error) {
      if (error.code === 11000) return { changed: false };
      throw error;
    }
  },
  async read(userId, movieId, trailerId, day) {
    // Mongoose casts find() filters but not aggregation match stages.
    const accountId = actionModel.schema?.path('userId')?.cast(userId) || userId;
    const [actions, sessions, reaction] = await Promise.all([
      // Group before returning: repeated opens/impressions do not accumulate points.
      actionModel.aggregate([
        { $match: { userId: accountId, movieId, trailerId, day } },
        { $group: { _id: '$type', occurredAt: { $min: '$occurredAt' } } },
        { $project: { _id: 0, type: '$_id', occurredAt: 1 } },
      ]),
      progressModel.find({ userId, movieId, trailerId }).select({ _id: 0 }).lean(),
      // Existing LikeButton's canonical trailer type. Do not read movie/triller likes.
      reactionModel.findOne({ userId, type: 'movieTriller', targetId: `${movieId}-${trailerId}` })
        .select({ _id: 0, value: 1, updatedAt: 1 }).lean(),
    ]);
    return { actions, sessions, reaction };
  },
});

module.exports = { createSignalsRepository };
