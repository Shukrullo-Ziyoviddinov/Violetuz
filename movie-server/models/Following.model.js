const mongoose = require('mongoose');

/** Obuna: aktyor, artist yoki kanal. Tur hujjatlarni aralashtirmaydi. */
const FOLLOWING_TYPES = Object.freeze(['actor', 'artist', 'channel']);

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
    /** Actor (number), Artist yoki Channel id — string sifatida */
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
