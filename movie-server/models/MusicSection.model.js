const mongoose = require('mongoose');

/**
 * Music section catalog (NOT music page layout).
 * Each doc defines a music/album row: id, categoryNameMusic, titles, links.
 */
const musicSectionSchema = new mongoose.Schema(
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
      default: 'music',
    },
    initialCount: {
      type: Number,
      default: 10,
    },
    detailPathType: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    strict: true,
    collection: 'musicSections',
    versionKey: false,
  }
);

musicSectionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const MusicSection =
  mongoose.models.MusicSection || mongoose.model('MusicSection', musicSectionSchema);

module.exports = MusicSection;
