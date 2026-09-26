const mongoose = require('mongoose');

/**
 * Mix martasi. Bitta user va bitta qo'shiq — bitta qator.
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

musicMixPlayCountSchema.index({ userId: 1, contentId: 1 }, { unique: true });
musicMixPlayCountSchema.index({ userId: 1, genre: 1, playCount: -1 });

module.exports = mongoose.model('MusicMixPlayCount', musicMixPlayCountSchema);
