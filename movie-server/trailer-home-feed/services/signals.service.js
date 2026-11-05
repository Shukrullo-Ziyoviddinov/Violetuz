'use strict';
const { badRequest, notFound } = require('../../utils/errors');
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { parseTrailerIdentity, validateSignalAction, signalDay } = require('../signals/signalProtocol');
const { deriveSignalState } = require('../signals/deriveSignalState');
const { createSignalsRepository } = require('../repositories/trailerSignals.repository');

const createSignalsService = ({ movieModel, actionModel, reactionModel, progressModel, now = Date.now }) => {
  const repository = createSignalsRepository({ actionModel, reactionModel, progressModel });
  return {
    async report(userId, input) {
      if (!userId) throw badRequest('Authenticated user required');
      let action;
      try { action = validateSignalAction(input, trailerHomeFeedWeights.engagement.impression); }
      catch (error) { throw badRequest(error.message); }
      const movie = await movieModel.findOne({ id: action.movieId, 'trailersVideo.id': action.trailerId }).select({ id: 1 }).lean();
      if (!movie) throw notFound('Movie trailer not found');
      const nowMs = now();
      const day = signalDay(nowMs);
      return { ...await repository.record(userId, action, day, new Date(nowMs)), day, type: action.type };
    },
    async read(userId, input) {
      if (!userId) throw badRequest('Authenticated user required');
      let ids;
      try { ids = parseTrailerIdentity(input); } catch (error) { throw badRequest(error.message); }
      const day = signalDay(now());
      const data = await repository.read(userId, ids.movieId, ids.trailerId, day);
      return { ...ids, day, todayActions: data.actions, reactionUpdatedAt: data.reaction?.updatedAt || null, ...deriveSignalState(data) };
    },
  };
};
module.exports = { createSignalsService };
