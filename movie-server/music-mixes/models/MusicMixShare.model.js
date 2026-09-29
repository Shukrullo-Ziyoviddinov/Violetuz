const mongoose = require('mongoose');
const { MIX_CONTENT_TYPES } = require('../contentType');

/**
 * Mix share snapshot. Faqat o'qish uchun token.
 * Collection: music_mix_shares
 *
 * Qabul qiluvchi music_mixes / play_counts ga yozilmaydi.
 * coverImg — share preview (birinchi element rasmi).
 *
 * @module music-mixes/models/MusicMixShare
 */

const mixShareTrackSchema = new mongoose.Schema(
  {
    contentId: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const musicMixShareSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    /** Share yaratgan user. Qabul qiluvchi emas. */
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: MIX_CONTENT_TYPES,
      default: 'music',
      trim: true,
    },
    genre: {
      type: String,
      required: true,
      trim: true,
    },
    /** Deep-link lead (birinchi trek/klip). */
    leadId: {
      type: String,
      required: true,
      trim: true,
    },
    /** Telegram / share preview: birinchi element rasmi. */
    coverImg: {
      type: String,
      default: '',
      trim: true,
    },
    tracks: {
      type: [mixShareTrackSchema],
      required: true,
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'music_mix_shares',
    versionKey: false,
  }
);

musicMixShareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
musicMixShareSchema.index({ ownerUserId: 1, contentType: 1, genre: 1, expiresAt: -1 });

module.exports = mongoose.model('MusicMixShare', musicMixShareSchema);
