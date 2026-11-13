const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants');

/**
 * Qo‘ng‘iroqchadagi bitta xabar.
 * actor — yozilgan paytdagi obunachi. Keyin qayta qidirilmaydi.
 */
const notificationSchema = new mongoose.Schema(
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
      enum: NOTIFICATION_TYPES,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actor: {
      id: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true, maxlength: 80 },
      username: { type: String, trim: true, maxlength: 40, default: '' },
      avatar: { type: String, trim: true, maxlength: 500, default: '' },
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
