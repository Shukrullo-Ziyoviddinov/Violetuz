const mongoose = require('mongoose');
const { MIX_CONTENT_TYPES } = require('../contentType');

/**
 * Mix martasi. Bitta user, bitta tur va bitta kontent — bitta qator.
 * Collection: music_mix_play_counts
 *
 * music katalogi, tinglash progressi va "Siz uchun" keshidan alohida.
 * playCount faqat mixdagi 80% martalari. Yangi tracks jadvali yo'q.
 *
 * @module music-mixes/models/MusicMixPlayCount
 */

const musicMixPlayCountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** music — qo'shiq. klip — video. Eski qator music. */
    contentType: {
      type: String,
      required: true,
      enum: MIX_CONTENT_TYPES,
      default: 'music',
      trim: true,
    },
    contentId: {
      type: String,
      required: true,
      trim: true,
    },
    genre: {
      type: String,
      required: true,
      trim: true,
    },
    playCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastPlayedAt: {
      type: Date,
      default: Date.now,
    },
    /** Shu tinglash sessiyasi allaqachon hisoblangan. Yangi sessiya yangi marta. */
    lastSessionId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'music_mix_play_counts',
    versionKey: false,
  }
);

musicMixPlayCountSchema.index({ userId: 1, contentType: 1, contentId: 1 }, { unique: true });
musicMixPlayCountSchema.index({ userId: 1, contentType: 1, genre: 1, playCount: -1 });

module.exports = mongoose.model('MusicMixPlayCount', musicMixPlayCountSchema);
