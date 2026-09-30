/**
 * Tayyor "shunga o'xshash" ro'yxat. Sahifa ochilganda shu yerda o'qiladi.
 * Collection: movie_similar_cache
 *
 * Franshiza alohida jadval emas — movies.franchiseMovieIds.
 * recommendation_* / home_feed_* / music_mixes dan alohida.
 *
 * @module movie-similar/models/MovieSimilarCache
 */

'use strict';

const mongoose = require('mongoose');
const { similarityWeights } = require('../config/similarityWeights');

const LAYER_VALUES = Object.freeze([
  similarityWeights.layers.franchise,
  similarityWeights.layers.nameGenre,
  similarityWeights.layers.general,
]);

const movieSimilarCacheSchema = new mongoose.Schema(
  {
    /** Manba kino (catalog movies.id). */
    movieId: {
      type: Number,
      required: true,
      index: true,
    },
    /** O'xshash kino (catalog movies.id). */
    similarMovieId: {
      type: Number,
      required: true,
    },
    /** 1 = eng yuqori. Qatlamlar aralashmaydi: avval franchise, keyin name_genre, keyin general. */
    position: {
      type: Number,
      required: true,
      min: 1,
    },
    layer: {
      type: String,
      required: true,
      enum: LAYER_VALUES,
      trim: true,
    },
    /**
     * Q3 umumiy ball. Q1/Q2 da 0 yoki null bo'lishi mumkin
     * (franshiza tartibi array tartibi; nom+janr — GATE, ball emas).
     */
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    /** Bir yozuv to'plami. Eski qatorlar shu id dan farqi bilan o'chiriladi. */
    batchId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'movie_similar_cache',
    versionKey: false,
  }
);

movieSimilarCacheSchema.index({ movieId: 1, similarMovieId: 1 }, { unique: true });
movieSimilarCacheSchema.index({ movieId: 1, position: 1 });

module.exports =
  mongoose.models.MovieSimilarCache ||
  mongoose.model('MovieSimilarCache', movieSimilarCacheSchema);
