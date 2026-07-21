const mongoose = require('mongoose');

/**
 * Movie section catalog (NOT home page layout).
 * Each doc defines a home/category movie row: id, categoryName, titles, links.
 */
const movieSectionSchema = new mongoose.Schema(
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
    categoryName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    titleKey: {
      type: String,
      required: true,
      trim: true,
    },
    moreTo: {
      type: String,
      trim: true,
      default: '',
    },
    showHorizontalScroll: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    strict: true,
    collection: 'movieSections',
    versionKey: false,
  }
);

movieSectionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const MovieSection =
  mongoose.models.MovieSection || mongoose.model('MovieSection', movieSectionSchema);

module.exports = MovieSection;
