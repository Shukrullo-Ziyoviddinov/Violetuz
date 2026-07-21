const mongoose = require('mongoose');

/**
 * Music page layout document (NOT a music section catalog).
 * One doc holds ordered UI blocks; each block has sortOrder for admin reorder.
 */
const musicPageBlockSchema = new mongoose.Schema(
  {
    sortOrder: {
      type: Number,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    sectionId: {
      type: String,
      trim: true,
    },
    variant: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    typeFilter: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const musicPageContentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: 'music',
      index: true,
    },
    blocks: {
      type: [musicPageBlockSchema],
      default: [],
    },
  },
  {
    strict: true,
    collection: 'musicPageContent',
    versionKey: false,
  }
);

musicPageContentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const MusicPageContent =
  mongoose.models.MusicPageContent ||
  mongoose.model('MusicPageContent', musicPageContentSchema);

module.exports = MusicPageContent;
