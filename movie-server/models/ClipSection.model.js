const mongoose = require('mongoose');

/**
 * Clip section catalog (NOT page layout).
 * Each doc defines a clips row: id, categoryNameMusic, titles, links.
 * Ordered by sortOrder for admin reorder.
 */
const clipSectionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    categoryNameMusic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    titleKey: {
      type: String,
      trim: true,
      default: '',
    },
    titleDefault: {
      type: String,
      trim: true,
      default: '',
    },
    moreTo: {
      type: String,
      trim: true,
      default: '',
    },
    wishlistType: {
      type: String,
      trim: true,
      default: 'klip',
    },
    initialCount: {
      type: Number,
      default: 10,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    strict: true,
    collection: 'clipSections',
    versionKey: false,
  }
);

clipSectionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const ClipSection =
  mongoose.models.ClipSection || mongoose.model('ClipSection', clipSectionSchema);

module.exports = ClipSection;
