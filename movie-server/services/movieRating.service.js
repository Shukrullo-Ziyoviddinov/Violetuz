const MovieRating = require('../models/MovieRating.model');
const Movie = require('../models/Movie.model');
const { badRequest, notFound } = require('../utils/errors');
const {
  safeNumber,
  clampVote,
  applyVoteToRating,
  reverseVoteFromRating,
} = require('../utils/calculateMovieRating');

const stripMongoMeta = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, __v, ...rest } = plain;
  return rest;
};

const normalizeMovieId = (raw) => {
  if (raw == null || raw === '') throw badRequest('movieId majburiy');
  return String(raw).trim();
};

const buildMovieSnapshot = (movie, ratingAfter) => {
  const plain = stripMongoMeta(movie) || {};
  return {
    id: plain.id,
    title: plain.title || null,
    homeImg: plain.homeImg || null,
    poster: plain.poster || plain.image || null,
    image: plain.image || plain.poster || null,
    ageRestriction: plain.ageRestriction ?? null,
    type: plain.type || 'movie',
    category: plain.category || null,
    rating: ratingAfter,
  };
};

const toClientItem = (row) => ({
  movieId: row.movieId,
  value: row.value,
  ratingAfter: row.ratingAfter,
  snapshot: row.snapshot || null,
  updatedAt: row.updatedAt,
  createdAt: row.createdAt,
});

const findMovieByCatalogId = async (movieIdStr) => {
  const numericId = Number(movieIdStr);
  if (Number.isInteger(numericId) && String(numericId) === movieIdStr) {
    return Movie.findOne({ id: numericId });
  }
  return null;
};

/** Profil → reyting history */
const listMyHistory = async (userId) => {
  const rows = await MovieRating.find({ userId }).sort({ updatedAt: -1 }).lean();
  return rows.map(toClientItem);
};

/** Bitta film uchun joriy user vote */
const getMyRatingForMovie = async (userId, movieIdRaw) => {
  const movieId = normalizeMovieId(movieIdRaw);
  const row = await MovieRating.findOne({ userId, movieId }).lean();
  if (!row) return null;
  return toClientItem(row);
};

/**
 * Rating berish / yangilash.
 * - movie_ratings ga yoziladi
 * - Movie.rating calculate algoritmi bilan yangilanadi
 */
const submitRating = async (userId, { movieId: movieIdRaw, value }) => {
  const movieId = normalizeMovieId(movieIdRaw);
  const rawNum = Number(value);
  if (!Number.isFinite(rawNum) || rawNum < 1 || rawNum > 10) {
    throw badRequest('value 1–10 oralig‘ida bo‘lishi kerak');
  }
  const voteValue = clampVote(rawNum);

  const movie = await findMovieByCatalogId(movieId);
  if (!movie) throw notFound(`Kino topilmadi: ${movieId}`);

  const existing = await MovieRating.findOne({ userId, movieId }).lean();
  let nextRating = safeNumber(movie.rating);

  if (existing) {
    if (existing.value === voteValue) {
      return {
        item: toClientItem(existing),
        movieRating: nextRating,
        userVote: voteValue,
        unchanged: true,
      };
    }
    nextRating = reverseVoteFromRating(nextRating, existing.value);
    nextRating = applyVoteToRating(nextRating, voteValue);
  } else {
    nextRating = applyVoteToRating(nextRating, voteValue);
  }

  movie.rating = nextRating;
  await movie.save();

  const snapshot = buildMovieSnapshot(movie, nextRating);
  const row = await MovieRating.findOneAndUpdate(
    { userId, movieId },
    {
      $set: {
        value: voteValue,
        snapshot,
        ratingAfter: nextRating,
      },
      $setOnInsert: { userId, movieId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    item: toClientItem(row),
    movieRating: nextRating,
    userVote: voteValue,
    unchanged: false,
  };
};

module.exports = {
  listMyHistory,
  getMyRatingForMovie,
  submitRating,
};
