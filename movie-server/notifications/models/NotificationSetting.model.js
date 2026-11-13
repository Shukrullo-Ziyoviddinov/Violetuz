const mongoose = require('mongoose');

/**
 * Hozir faqat «Yangi obunachilar».
 * Yoqilgan bo‘lsa kimdir obuna bo‘lganda xabar ketadi.
 */
const notificationSettingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    subscribers: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'notification_settings',
  }
);

module.exports = mongoose.model('NotificationSetting', notificationSettingSchema);
