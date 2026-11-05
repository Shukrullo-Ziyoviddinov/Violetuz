'use strict';
const { buildCandidatePools, validateCandidateContext } = require('../candidates/buildCandidatePools');

const createCandidateService = ({ readCatalog, readProfile, readTrending, readExposure }) => ({
  async collect({ sessionSeed, nowMs = Date.now(), excludeKeys = [] } = {}) {
    validateCandidateContext({ sessionSeed, nowMs });
    const catalog = await readCatalog();
    const context = { catalog, nowMs };
    const [profile, trendSnapshot, exposureSnapshot] = await Promise.all([
      readProfile(context), readTrending(context), readExposure ? readExposure(context) : null,
    ]);
    return buildCandidatePools({ catalog, profile, trendSnapshot, exposureSnapshot, sessionSeed, nowMs, excludeKeys });
  },
});

const createDefaultCandidateService = (readProfile) => {
  const { readTrailerCatalog } = require('../repositories/trailerCatalog.read');
  const { computeTrailerTrending } = require('./trending.service');
  const { createExposureReader } = require('../repositories/trailerExposure.read');
  return createCandidateService({ readCatalog: readTrailerCatalog, readProfile,
    readTrending: ({ nowMs }) => computeTrailerTrending({ nowMs }),
    readExposure: createExposureReader({ actionModel: require('../models/TrailerSignalAction.model') }),
  });
};

const collectAccountTrailerCandidates = async (userId, options) => {
  if (!userId) throw new TypeError('Account identity is required');
  const { accountPersonalTaste } = require('./personalTaste.service');
  return createDefaultCandidateService(({ nowMs }) => accountPersonalTaste(userId, { nowMs })).collect(options);
};
const collectGuestTrailerCandidates = async (history, options) => {
  const { guestPersonalTaste } = require('./personalTaste.service');
  return createDefaultCandidateService(({ nowMs }) => guestPersonalTaste(history, { nowMs })).collect(options);
};

module.exports = { createCandidateService, createDefaultCandidateService, collectAccountTrailerCandidates, collectGuestTrailerCandidates };
