const mongoose = require('mongoose');

/**
 * Bir foydalanuvchi wishlist yozuvi (alohida collection).
 * type + itemId katalog entityga bog‘lanadi; snapshot saqlash paytidagi nusxa.
 */
const WISHLIST_TYPES = Object.freeze([
  'movie',
  'music',
  'album',
  'klip',
  'konsert',
  'shorts',
  'movieShorts',
  'musicshorts',
  'triller',
]);

const wishlistSchema = new mongoose.Schema(
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
      enum: WISHLIST_TYPES,
      index: true,
    },
    /** Katalog id (raqam yoki string) — har doim string sifatida saqlanadi */
    itemId: {
      type: String,
      required: true,
      trim: true,
    },
    /** Saqlash paytidagi katalog obyekti (UI/offline uchun) */
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'wishlists',
  }
);

wishlistSchema.index({ userId: 1, type: 1, itemId: 1 }, { unique: true });
wishlistSchema.index({ userId: 1, createdAt: -1 });
wishlistSchema.index({ type: 1, itemId: 1 });

wishlistSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this.itemId,
    type: this.type,
    snapshot: this.snapshot || null,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
module.exports.WISHLIST_TYPES = WISHLIST_TYPES;
