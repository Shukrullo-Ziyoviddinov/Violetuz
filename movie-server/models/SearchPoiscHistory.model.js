const mongoose = require('mongoose');

/**
 * Search natijasidan click tarixi (alohida collection).
 * Faqat login user. Query matni saqlanmaydi — faqat bosilgan item.
 * Kelishuv: A1 (login) + B1 (movie | music | klip | konsert).
 */
const SEARCH_POISC_HISTORY_TYPES = Object.freeze(['movie', 'music', 'klip', 'konsert']);

const searchPoiscHistorySchema = new mongoose.Schema(
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
      enum: SEARCH_POISC_HISTORY_TYPES,
      index: true,
    },
    /** Katalog id — har doim string */
    itemId: {
      type: String,
      required: true,
      trim: true,
    },
    /** Click paytidagi UI uchun qisqa nusxa (title, img, …) */
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    /** Oxirgi click vaqti — tarix tartibi shu bo‘yicha */
    clickedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'searchPoiscHistory',
  }
);

searchPoiscHistorySchema.index({ userId: 1, type: 1, itemId: 1 }, { unique: true });
searchPoiscHistorySchema.index({ userId: 1, clickedAt: -1 });

searchPoiscHistorySchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this.itemId,
    type: this.type,
    snapshot: this.snapshot || null,
    clickedAt: this.clickedAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('SearchPoiscHistory', searchPoiscHistorySchema);
module.exports.SEARCH_POISC_HISTORY_TYPES = SEARCH_POISC_HISTORY_TYPES;
