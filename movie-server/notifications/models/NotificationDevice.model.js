const mongoose = require('mongoose');

/**
 * Foydalanuvchi ruxsat bergan qurilma.
 * Push kalitlari shu yerda. Hisob paroli saqlanmaydi.
 */
const notificationDeviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    keys: {
      p256dh: { type: String, required: true, trim: true, maxlength: 300 },
      auth: { type: String, required: true, trim: true, maxlength: 300 },
    },
  },
  {
    timestamps: true,
    collection: 'notification_devices',
  }
);

notificationDeviceSchema.index({ endpoint: 1 }, { unique: true });
notificationDeviceSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('NotificationDevice', notificationDeviceSchema);
