const mongoose = require('mongoose');

/** Bitta collection — type orqali ajratiladi */
const REACTION_TYPES = Object.freeze([
  'movie',
  'music',
  'klip',
  'konsert',
  'triller',
  'movieTriller',
  'shorts',
]);

/** Like-history ga tushadigan typelar */
const HISTORY_TYPES = Object.freeze(['movie', 'music', 'klip', 'konsert']);

const REACTION_VALUES = Object.freeze(['like', 'dislike']);

const userReactionSchema = new mongoose.Schema(
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
      enum: REACTION_TYPES,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
    },
    /** shorts uchun faqat like; qolganlar like|dislike */
    value: {
      type: String,
      required: true,
      enum: REACTION_VALUES,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'user_reactions',
  }
);

userReactionSchema.index({ userId: 1, type: 1, targetId: 1 }, { unique: true });
userReactionSchema.index({ userId: 1, value: 1, updatedAt: -1 });
/** Trending precompute: movie likes in time window ($match type+value+updatedAt) */
userReactionSchema.index({ type: 1, value: 1, updatedAt: -1 });

module.exports = mongoose.model('UserReaction', userReactionSchema);
module.exports.REACTION_TYPES = REACTION_TYPES;
module.exports.HISTORY_TYPES = HISTORY_TYPES;
module.exports.REACTION_VALUES = REACTION_VALUES;
