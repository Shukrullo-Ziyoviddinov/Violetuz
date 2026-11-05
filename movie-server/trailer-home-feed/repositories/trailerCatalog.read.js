'use strict';

const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { buildTrailerCatalog } = require('../catalog/buildTrailerCatalog');

/** Read all channels before candidate selection. Importing the module does not load Mongoose. */
const readTrailerCatalog = async ({ movieModel } = {}) => {
  const Movie = movieModel || require('../../models/Movie.model');
  const config = trailerHomeFeedWeights.catalog;
  const projection = { _id: 0, title: 1, homeImg: 1, [config.trailersField]: 1 };
  Object.values(config.movieFields).forEach((field) => { projection[field] = 1; });
  config.uploadedAtFields.forEach((field) => { projection[field] = 1; });
  const movies = await Movie.find({
    [config.trailersField]: { $type: 'array' },
    [`${config.trailersField}.0`]: { $exists: true },
  }).select(projection).sort({ [config.movieFields.id]: 1 }).lean();
  return buildTrailerCatalog(movies);
};

module.exports = { readTrailerCatalog };
