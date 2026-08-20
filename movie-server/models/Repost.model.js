const mongoose = require('mongoose');

/**
 * Foydalanuvchi repostlari — alohida collection.
 * Katalogning to‘liq hujjati saqlanmaydi: faqat type + itemId + ingichka snapshot.
 */
const REPOST_TYPES = Object.freeze([
  'movie',
  'music',
  'klip',
  'konsert',
  'movieShorts',
  'musicshorts',
]);

const snapshotSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    route: { type: String, trim: true, default: '' },
    rating: { type: Number },
    artistName: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
  },
  { _id: false }
);

const repostSchema = new mongoose.Schema(
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
      enum: REPOST_TYPES,
      index: true,
    },
    /** Katalog id — har doim string */
    itemId: {
      type: String,
      required: true,
      trim: true,
    },
    snapshot: {
      type: snapshotSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    collection: 'reposts',
    versionKey: false,
  }
);

repostSchema.index({ userId: 1, type: 1, itemId: 1 }, { unique: true });
repostSchema.index({ userId: 1, createdAt: -1 });
repostSchema.index({ userId: 1, type: 1, createdAt: -1 });
repostSchema.index({ type: 1, itemId: 1 });

module.exports = mongoose.model('Repost', repostSchema);
module.exports.REPOST_TYPES = REPOST_TYPES;
