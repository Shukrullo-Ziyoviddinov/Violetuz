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

const validateActorIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid actor id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateActorsGenreParam = (req, _res, next) => {
  const actorsGenre = String(req.params.actorsGenre || '').trim();
  if (!actorsGenre) {
    return next(badRequest('Invalid actorsGenre. It is required.'));
  }

  req.params.actorsGenre = actorsGenre;
  next();
};

const validateActorListQuery = (req, _res, next) => {
  const { actorsGenre, search, ids } = req.query;

  if (actorsGenre != null && !String(actorsGenre).trim()) {
    return next(badRequest('actorsGenre query cannot be empty.'));
  }

  if (search != null && !String(search).trim()) {
    return next(badRequest('search query cannot be empty.'));
  }

  if (ids != null) {
    const raw = String(ids).trim();
    if (!raw) {
      return next(badRequest('ids query cannot be empty.'));
    }

    const parts = raw.split(',').map((value) => value.trim()).filter(Boolean);
    if (parts.length === 0) {
      return next(badRequest('ids query cannot be empty.'));
    }

    const invalid = parts.find((value) => {
      const numericId = Number(value);
      return !Number.isInteger(numericId) || numericId <= 0;
    });

    if (invalid != null) {
      return next(badRequest('ids query must be a comma-separated list of positive integers.'));
    }

    req.query.ids = parts.join(',');
  }

  if (actorsGenre != null) {
    req.query.actorsGenre = String(actorsGenre).trim();
  }

  if (search != null) {
    req.query.search = String(search).trim();
  }

  next();
};

const validateArtistMusicStoryIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid artist music story id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateArtistMusicStoryListQuery = (req, _res, next) => {
  const { artistId, search } = req.query;

  if (artistId != null && !String(artistId).trim()) {
    return next(badRequest('artistId query cannot be empty.'));
  }

  if (search != null && !String(search).trim()) {
    return next(badRequest('search query cannot be empty.'));
  }

  if (artistId != null) {
    req.query.artistId = String(artistId).trim();
  }

  if (search != null) {
    req.query.search = String(search).trim();
  }

  next();
};

const validateBannerIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid banner id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateBannerLangParam = (req, _res, next) => {
  const lang = String(req.params.lang || '').trim().toLowerCase();
  if (lang !== 'uz' && lang !== 'ru') {
    return next(badRequest('Invalid lang. Allowed values: uz, ru.'));
  }

  req.params.lang = lang;
  next();
};

const validateBannerListQuery = (req, _res, next) => {
  const { lang, movieId } = req.query;

  if (lang != null) {
    const normalized = String(lang).trim().toLowerCase();
    if (normalized !== 'uz' && normalized !== 'ru') {
      return next(badRequest('lang query must be uz or ru.'));
    }
    req.query.lang = normalized;
  }

  if (movieId != null) {
    const numericId = Number(movieId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return next(badRequest('movieId query must be a positive integer.'));
    }
    req.query.movieId = String(numericId);
  }

  next();
};

const validateGenreIdParam = (req, _res, next) => {
  const genreId = String(req.params.id || '').trim();
  if (!genreId) {
    return next(badRequest('Invalid genre id. It is required.'));
  }

  req.params.id = genreId;
  next();
};

const validateGenreListQuery = (req, _res, next) => {
  const { search } = req.query;

  if (search != null && !String(search).trim()) {
    return next(badRequest('search query cannot be empty.'));
  }

  if (search != null) {
    req.query.search = String(search).trim();
  }

  next();
};

const validateNavCategoryIdParam = (req, _res, next) => {
  const categoryId = String(req.params.id || '').trim();
  if (!categoryId) {
    return next(badRequest('Invalid category id. It is required.'));
  }

  req.params.id = categoryId;
  next();
};

const validateNavCategoryListQuery = (req, _res, next) => {
  const { search } = req.query;

  if (search != null && !String(search).trim()) {
    return next(badRequest('search query cannot be empty.'));
  }

  if (search != null) {
    req.query.search = String(search).trim();
  }

  next();
};

const validateActorPageLabelIdParam = (req, _res, next) => {
  const labelId = String(req.params.id || '').trim();
  if (!labelId) {
    return next(badRequest('Invalid actor page label id. It is required.'));
  }

  req.params.id = labelId;
  next();
};

const validateAdIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid ad id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateAdListQuery = (req, _res, next) => {
  const { isActive } = req.query;

  if (isActive != null) {
    const raw = String(isActive).trim().toLowerCase();
    if (raw !== 'true' && raw !== 'false') {
      return next(badRequest('isActive query must be true or false.'));
    }
    req.query.isActive = raw;
  }

  next();
};

const validateShortVideoIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid short id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateShortVideoMovieIdParam = (req, _res, next) => {
  const numericId = Number(req.params.movieId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid movie id. It must be a positive integer.'));
  }

  req.params.movieId = String(numericId);
  next();
};

const validateShortVideoListQuery = (req, _res, next) => {
  const { movieId, type } = req.query;

  if (movieId != null) {
    const numericId = Number(movieId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return next(badRequest('movieId query must be a positive integer.'));
    }
    req.query.movieId = String(numericId);
  }

  if (type != null) {
    const normalized = String(type).trim();
    if (!normalized) {
      return next(badRequest('type query must be a non-empty string.'));
    }
    req.query.type = normalized;
  }

  next();
};

const validateVideoBannerIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid video banner id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateVideoBannerTypeParam = (req, _res, next) => {
  const type = String(req.params.type || '').trim().toLowerCase();
  if (type !== 'movie' && type !== 'music') {
    return next(badRequest('Invalid type. Allowed values: movie, music.'));
  }

  req.params.type = type;
  next();
};

const validateVideoBannerListQuery = (req, _res, next) => {
  const { type, refId } = req.query;

  if (type != null) {
    const normalized = String(type).trim().toLowerCase();
    if (normalized !== 'movie' && normalized !== 'music') {
      return next(badRequest('type query must be movie or music.'));
    }
    req.query.type = normalized;
  }

  if (refId != null) {
    const numericId = Number(refId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return next(badRequest('refId query must be a positive integer.'));
    }
    req.query.refId = String(numericId);
  }

  next();
};

const validateArtistIdParam = (req, _res, next) => {
  const artistId = String(req.params.id || '').trim();
  if (!artistId) {
    return next(badRequest('Invalid artist id. It is required.'));
  }

  req.params.id = artistId;
  next();
};

const validateMusicShortIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid music short id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
  next();
};

const validateMusicShortListQuery = (req, _res, next) => {
  const { contentType, artistId, musicId, movieId } = req.query;

  if (contentType != null) {
    const normalized = String(contentType).trim().toLowerCase();
    if (!['music', 'klip', 'konsert'].includes(normalized)) {
      return next(badRequest('contentType query must be music, klip, or konsert.'));
    }
    req.query.contentType = normalized;
  }

  if (artistId != null) {
    const normalized = String(artistId).trim();
    if (!normalized) {
      return next(badRequest('artistId query must be a non-empty string.'));
    }
    req.query.artistId = normalized;
  }

  if (musicId != null) {
    const numericId = Number(musicId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return next(badRequest('musicId query must be a positive integer.'));
    }
    req.query.musicId = String(numericId);
  }

  if (movieId != null) {
    const numericId = Number(movieId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return next(badRequest('movieId query must be a positive integer.'));
    }
    req.query.movieId = String(numericId);
  }

  next();
};

const validateMusicBannerIdParam = (req, _res, next) => {
  const numericId = Number(req.params.id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return next(badRequest('Invalid music banner id. It must be a positive integer.'));
  }

  req.params.id = String(numericId);
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
  validateActorIdParam,
  validateActorsGenreParam,
  validateActorListQuery,
  validateArtistMusicStoryIdParam,
  validateArtistMusicStoryListQuery,
  validateBannerIdParam,
  validateBannerLangParam,
  validateBannerListQuery,
  validateGenreIdParam,
  validateGenreListQuery,
  validateNavCategoryIdParam,
  validateNavCategoryListQuery,
  validateActorPageLabelIdParam,
  validateAdIdParam,
  validateAdListQuery,
  validateShortVideoIdParam,
  validateShortVideoMovieIdParam,
  validateShortVideoListQuery,
  validateVideoBannerIdParam,
  validateVideoBannerTypeParam,
  validateVideoBannerListQuery,
  validateArtistIdParam,
  validateMusicShortIdParam,
  validateMusicShortListQuery,
  validateMusicBannerIdParam,
};
