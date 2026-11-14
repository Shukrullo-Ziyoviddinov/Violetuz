'use strict';

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    pairKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    members: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'chat_conversations',
  }
);

conversationSchema.index({ members: 1 });

module.exports = mongoose.model('ChatConversation', conversationSchema);
