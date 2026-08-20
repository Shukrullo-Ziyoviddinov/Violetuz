const mongoose = require('mongoose');

/** Shorts share hodisalari — har bir kanal bosilishi alohida yozuv (+1). */
const SHORT_SHARE_TYPES = Object.freeze(['movieShorts', 'musicshorts']);

const SHORT_SHARE_CHANNELS = Object.freeze([
  'telegram',
  'whatsapp',
  'facebook',
  'twitter',
]);

const shortShareEventSchema = new mongoose.Schema(
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
      enum: SHORT_SHARE_TYPES,
      index: true,
    },
    itemId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    channel: {
      type: String,
      required: true,
      enum: SHORT_SHARE_CHANNELS,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'shortShareEvents',
    versionKey: false,
  }
);

shortShareEventSchema.index({ type: 1, itemId: 1 });
shortShareEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ShortShareEvent', shortShareEventSchema);
module.exports.SHORT_SHARE_TYPES = SHORT_SHARE_TYPES;
module.exports.SHORT_SHARE_CHANNELS = SHORT_SHARE_CHANNELS;
