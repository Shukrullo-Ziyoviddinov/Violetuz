'use strict';

const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    video: {
      url: {
        type: String,
        trim: true,
        maxlength: 500,
        default: '',
      },
      duration: {
        type: Number,
        min: 0,
        max: 60,
        default: 0,
      },
      start: {
        type: Number,
        min: 0,
        max: 60,
        default: 0,
      },
      viewOnce: {
        type: Boolean,
        default: false,
      },
    },
    animated: {
      type: Boolean,
      default: false,
    },
    animationId: {
      type: String,
      trim: true,
      maxlength: 16,
      default: '',
    },
    gif: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    readAt: {
      type: Date,
      default: null,
    },
    hiddenFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    pinnedFor: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      at: {
        type: Date,
        default: Date.now,
      },
    }],
    reactions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      emoji: {
        type: String,
        trim: true,
        maxlength: 32,
      },
      emojiId: {
        type: String,
        trim: true,
        maxlength: 32,
        default: '',
      },
      at: {
        type: Date,
        default: Date.now,
      },
    }],
    replyTo: {
      messageId: { type: String, trim: true, maxlength: 64 },
      senderId: { type: String, trim: true, maxlength: 64 },
      text: { type: String, trim: true, maxlength: 2000 },
      animated: { type: Boolean, default: false },
      animationId: { type: String, trim: true, maxlength: 16, default: '' },
      gif: { type: String, trim: true, maxlength: 180, default: '' },
    },
  },
  {
    timestamps: true,
    collection: 'chat_messages',
  }
);

chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ conversationId: 1, recipientId: 1, readAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
