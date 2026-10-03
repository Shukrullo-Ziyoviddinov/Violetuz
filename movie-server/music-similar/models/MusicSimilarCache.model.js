/**
 * Tayyor "shunga o'xshash" ro'yxat. Sahifa ochilganda shu yerda o'qiladi.
 * Collection: music_similar_cache
 *
 * Franshiza alohida jadval emas — music.franchiseMusicIds / clips.franchiseClipIds.
 * movie_similar_cache / recommendation_* / music_mixes dan alohida.
 *
 * @module music-similar/models/MusicSimilarCache
 */

'use strict';

const mongoose = require('mongoose');
const { similarityWeights } = require('../config/similarityWeights');

const LAYER_VALUES = Object.freeze([
  similarityWeights.layers.franchise,
  similarityWeights.layers.artistGenre,
  similarityWeights.layers.general,
]);

const CONTENT_TYPE_VALUES = Object.freeze([
  ...similarityWeights.contentTypes,
]);

const musicSimilarCacheSchema = new mongoose.Schema(
  {
    /** Manba (music / clip / album catalog id). */
    sourceId: {
      type: Number,
      required: true,
      index: true,
    },
    /** Pool type — music | klip | album. */
    contentType: {
      type: String,
      required: true,
      enum: CONTENT_TYPE_VALUES,
      trim: true,
      index: true,
    },
    /** O'xshash yozuv id (shu contentType katalogida). */
    similarId: {
      type: Number,
      required: true,
    },
    /** 1 = eng yuqori (engine interleave tartibi). */
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
     * Q3 umumiy ball. Q1/Q2 da 0 bo'lishi mumkin.
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
    collection: 'music_similar_cache',
    versionKey: false,
  }
);

musicSimilarCacheSchema.index(
  { sourceId: 1, contentType: 1, similarId: 1 },
  { unique: true }
);
musicSimilarCacheSchema.index({ sourceId: 1, contentType: 1, position: 1 });

module.exports =
  mongoose.models.MusicSimilarCache ||
  mongoose.model('MusicSimilarCache', musicSimilarCacheSchema);
