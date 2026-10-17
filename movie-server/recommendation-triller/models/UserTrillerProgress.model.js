const mongoose = require('mongoose');

/**
 * Hisobdagi foydalanuvchi × Parda ortida video foizi.
 * Bitta qator, faqat eng yuqori foiz saqlanadi.
 * Collection kino progressidan alohida.
 *
 * @module recommendation-triller/models/UserTrillerProgress
 */

const userTrillerProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trillerId: {
      type: Number,
      required: true,
    },
    /** 0..1, shu videoning o‘zi */
    completionRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'triller_user_video_progress',
    versionKey: false,
  }
);

userTrillerProgressSchema.index({ userId: 1, trillerId: 1 }, { unique: true });

module.exports =
  mongoose.models.TrillerUserVideoProgress ||
  mongoose.model('TrillerUserVideoProgress', userTrillerProgressSchema);
