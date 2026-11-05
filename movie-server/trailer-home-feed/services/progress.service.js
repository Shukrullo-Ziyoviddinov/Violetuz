'use strict';
const { validateProgressReport, summarizeProgress } = require('../progress/progressProtocol');
const { createProgressRepository } = require('../repositories/trailerProgress.repository');
const { badRequest, notFound } = require('../../utils/errors');

const createProgressService = ({ movieModel, progressModel }) => {
  const repository = createProgressRepository(progressModel);
  return {
    async report(userId, input) {
      if (!userId) throw badRequest('Authenticated user required');
      let report;
      try { report = validateProgressReport(input); } catch (error) { throw badRequest(error.message); }
      const exists = await movieModel.findOne({ id: report.movieId, 'trailersVideo.id': report.trailerId }).select({ id: 1 }).lean();
      if (!exists) throw notFound('Movie trailer not found');
      if (!report.totalPlayedSeconds) return { changed: false, progress: report };
      try { return await repository.save(userId, report); }
      catch (error) { if (error instanceof TypeError) throw badRequest(error.message); throw error; }
    },
    async read(userId, movieId, trailerId) {
      if (!userId) throw badRequest('Authenticated user required');
      if (![movieId, trailerId].every((value) => /^\d+$/.test(String(value)))) throw badRequest('Invalid trailer identity');
      const ids = [movieId, trailerId].map((value) => Number(value));
      if (ids.some((value) => !Number.isSafeInteger(value) || value <= 0)) throw badRequest('Invalid trailer identity');
      const sessions = await repository.list(userId, ...ids);
      return { movieId: ids[0], trailerId: ids[1], ...summarizeProgress(sessions) };
    },
  };
};

module.exports = { createProgressService };
