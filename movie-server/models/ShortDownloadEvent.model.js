const mongoose = require('mongoose');

/** Shorts download — har bir muvaffaqiyatli yuklash +1 (qayta yuklash ham). */
const SHORT_DOWNLOAD_TYPES = Object.freeze(['movieShorts', 'musicshorts']);

const shortDownloadEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: SHORT_DOWNLOAD_TYPES,
      index: true,
    },
    itemId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'shortDownloadEvents',
    versionKey: false,
  }
);

shortDownloadEventSchema.index({ type: 1, itemId: 1 });

module.exports = mongoose.model('ShortDownloadEvent', shortDownloadEventSchema);
module.exports.SHORT_DOWNLOAD_TYPES = SHORT_DOWNLOAD_TYPES;
