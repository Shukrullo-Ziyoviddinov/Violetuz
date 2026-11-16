'use strict';

const mongoose = require('mongoose');

const chatBackgroundChoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    backgroundId: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'chat_background_choices',
  }
);

module.exports = mongoose.model('ChatBackgroundChoice', chatBackgroundChoiceSchema);
