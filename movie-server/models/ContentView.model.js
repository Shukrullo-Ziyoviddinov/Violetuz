const mongoose = require('mongoose');

/**
 * Kontent ko‘rishlari — bitta user + type + itemId = bitta yozuv.
 * Append emas: unique index qayta kirishda +1 qilmaydi.
 */
const VIEW_TYPES = Object.freeze([
  'movie',
  'music',
  'album',
  'klip',
  'konsert',
  'triller',
  'trailer',
  'movieShorts',
  'musicshorts',
]);

const contentViewSchema = new mongoose.Schema(
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
      enum: VIEW_TYPES,
      index: true,
    },
    itemId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'contentViews',
    versionKey: false,
  }
);

contentViewSchema.index({ userId: 1, type: 1, itemId: 1 }, { unique: true });
contentViewSchema.index({ type: 1, itemId: 1 });

module.exports = mongoose.model('ContentView', contentViewSchema);
module.exports.VIEW_TYPES = VIEW_TYPES;
