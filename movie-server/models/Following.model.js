const mongoose = require('mongoose');

/** Obuna: faqat aktyor yoki artist */
const FOLLOWING_TYPES = Object.freeze(['actor', 'artist']);

const followingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: FOLLOWING_TYPES,
      index: true,
    },
    /** Actor (number) yoki Artist (string) id — string sifatida */
    targetId: {
      type: String,
      required: true,
      trim: true,
    },
    /** Saqlash paytidagi actor/artist nusxasi */
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'followings',
  }
);

followingSchema.index({ userId: 1, type: 1, targetId: 1 }, { unique: true });
followingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Following', followingSchema);
module.exports.FOLLOWING_TYPES = FOLLOWING_TYPES;
