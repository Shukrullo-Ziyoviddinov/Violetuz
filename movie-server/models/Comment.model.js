const mongoose = require('mongoose');
const { COMMENT_TYPES } = require('../constants/comment.constants');

/**
 * Polimorf kommentlar — bitta collection.
 * targetType + targetId → kino / triller / klip / konsert / shorts
 * parentId → javob (null = asosiy komment)
 * likedBy → like bosgan userlar; likes = likedBy.length
 */
const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: COMMENT_TYPES,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    /** Yozish paytidagi author snapshot */
    authorName: {
      type: String,
      trim: true,
      default: '',
    },
    authorAvatar: {
      type: String,
      trim: true,
      default: '',
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    /** History UI uchun target snapshot */
    targetSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'comments',
  }
);

commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
