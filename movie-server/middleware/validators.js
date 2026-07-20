const { badRequest } = require('../utils/errors');

const validateMovieIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid movie id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateCategoryParam = (req, _res, next) => {
  const categoryName = String(req.params.categoryName || '').trim();
  if (!categoryName) {
    return next(badRequest('Invalid categoryName. It is required.'));
  }

  req.params.categoryName = categoryName;
  next();
};

const validateMovieListQuery = (req, _res, next) => {
  const { categoryName, search } = req.query;

  if (categoryName != null && !String(categoryName).trim()) {
    return next(badRequest('categoryName query cannot be empty.'));
  }

  if (search != null && !String(search).trim()) {
    return next(badRequest('search query cannot be empty.'));
  }

  if (categoryName != null) {
    req.query.categoryName = String(categoryName).trim();
  }

  if (search != null) {
    req.query.search = String(search).trim();
  }

  next();
};

const validateMusicIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid music id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateMusicCategoryParam = (req, _res, next) => {
  const categoryNameMusic = String(req.params.categoryNameMusic || '').trim();
  if (!categoryNameMusic) {
    return next(badRequest('Invalid categoryNameMusic. It is required.'));
  }

  req.params.categoryNameMusic = categoryNameMusic;
  next();
};

const validateMusicArtistParam = (req, _res, next) => {
  const artistId = String(req.params.artistId || '').trim();
  if (!artistId) {
    return next(badRequest('Invalid artistId. It is required.'));
  }

  req.params.artistId = artistId;
  next();
};

const validateMusicListQuery = (req, _res, next) => {
  const { categoryNameMusic, artistId, search } = req.query;

  if (categoryNameMusic != null && !String(categoryNameMusic).trim()) {
    return next(badRequest('categoryNameMusic query cannot be empty.'));
  }

  if (artistId != null && !String(artistId).trim()) {
    return next(badRequest('artistId query cannot be empty.'));
  }

  if (search != null && !String(search).trim()) {
    return next(badRequest('search query cannot be empty.'));
  }

  if (categoryNameMusic != null) {
    req.query.categoryNameMusic = String(categoryNameMusic).trim();
  }

  if (artistId != null) {
    req.query.artistId = String(artistId).trim();
  }

  if (search != null) {
    req.query.search = String(search).trim();
  }

  next();
};

const validateAlbumIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid album id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateAlbumListQuery = (req, _res, next) => {
  const { categoryNameMusic, artistId, search } = req.query;

  if (categoryNameMusic != null && !String(categoryNameMusic).trim()) {
    return next(badRequest('categoryNameMusic query cannot be empty.'));
  }

  if (artistId != null && !String(artistId).trim()) {
    return next(badRequest('artistId query cannot be empty.'));
  }

  if (search != null && !String(search).trim()) {
    return next(badRequest('search query cannot be empty.'));
  }

  if (categoryNameMusic != null) {
    req.query.categoryNameMusic = String(categoryNameMusic).trim();
  }

  if (artistId != null) {
    req.query.artistId = String(artistId).trim();
  }

  if (search != null) {
    req.query.search = String(search).trim();
  }

  next();
};

const validateClipIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid clip id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateClipListQuery = (req, _res, next) => {
  const { categoryNameMusic, artistId, type, search } = req.query;

  if (categoryNameMusic != null && !String(categoryNameMusic).trim()) {
    return next(badRequest('categoryNameMusic query cannot be empty.'));
  }

  if (artistId != null && !String(artistId).trim()) {
    return next(badRequest('artistId query cannot be empty.'));
  }

  if (type != null && !String(type).trim()) {
    return next(badRequest('type query cannot be empty.'));
  }

  if (search != null && !String(search).trim()) {
    return next(badRequest('search query cannot be empty.'));
  }

  if (categoryNameMusic != null) {
    req.query.categoryNameMusic = String(categoryNameMusic).trim();
  }

  if (artistId != null) {
    req.query.artistId = String(artistId).trim();
  }

  if (type != null) {
    req.query.type = String(type).trim();
  }

  if (search != null) {
    req.query.search = String(search).trim();
  }

  next();
};

const validateConcertIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid concert id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateConcertListQuery = (req, _res, next) => {
  const { categoryNameMusic, artistId, type, search } = req.query;

  if (categoryNameMusic != null && !String(categoryNameMusic).trim()) {
    return next(badRequest('categoryNameMusic query cannot be empty.'));
  }

  if (artistId != null && !String(artistId).trim()) {
    return next(badRequest('artistId query cannot be empty.'));
  }

  if (type != null && !String(type).trim()) {
    return next(badRequest('type query cannot be empty.'));
  }

  if (search != null && !String(search).trim()) {
    return next(badRequest('search query cannot be empty.'));
  }

  if (categoryNameMusic != null) {
    req.query.categoryNameMusic = String(categoryNameMusic).trim();
  }

  if (artistId != null) {
    req.query.artistId = String(artistId).trim();
  }

  if (type != null) {
    req.query.type = String(type).trim();
  }

  if (search != null) {
    req.query.search = String(search).trim();
  }

  next();
};

module.exports = {
  validateMovieIdParam,
  validateCategoryParam,
  validateMovieListQuery,
  validateMusicIdParam,
  validateMusicCategoryParam,
  validateMusicArtistParam,
  validateMusicListQuery,
  validateAlbumIdParam,
  validateAlbumListQuery,
  validateClipIdParam,
  validateClipListQuery,
  validateConcertIdParam,
  validateConcertListQuery,
};
