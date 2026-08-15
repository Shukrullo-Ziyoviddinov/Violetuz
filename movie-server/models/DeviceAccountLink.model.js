const mongoose = require('mongoose');

/**
 * Bir qurilmada (httpOnly violet_device) bir nechta user hisobi.
 * Client JWT saqlamaydi — switch faqat shu bog‘lanish orqali.
 */
const deviceAccountLinkSchema = new mongoose.Schema(
  {
    deviceKeyHash: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'device_account_links',
  }
);

deviceAccountLinkSchema.index({ deviceKeyHash: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('DeviceAccountLink', deviceAccountLinkSchema);
