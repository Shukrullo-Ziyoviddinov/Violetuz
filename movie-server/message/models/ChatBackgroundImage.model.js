'use strict';

const mongoose = require('mongoose');

const chatBackgroundImageSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'chat_background_images',
  }
);

chatBackgroundImageSchema.index({ order: 1 });

module.exports = mongoose.model('ChatBackgroundImage', chatBackgroundImageSchema);
