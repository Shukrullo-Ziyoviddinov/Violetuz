const mongoose = require('mongoose');

const localizedStringSchema = new mongoose.Schema(
  {
    uz: { type: String, trim: true, default: '' },
    ru: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

/**
 * Home Categories bar items (/category/:id).
 * filterCategory matches movie.category for RecommendedPage filtering.
 */
const categorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: localizedStringSchema,
      required: true,
    },
    filterCategory: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: (value) =>
          typeof value === 'string' ||
          (Array.isArray(value) && value.every((item) => typeof item === 'string')),
        message: 'filterCategory must be a string or an array of strings',
      },
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    strict: true,
    collection: 'categories',
    versionKey: false,
  }
);

categorySchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

module.exports = Category;
