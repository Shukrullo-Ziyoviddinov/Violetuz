const mongoose = require('mongoose');

const localizedStringSchema = new mongoose.Schema(
  {
    uz: { type: String, trim: true, default: '' },
    ru: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const genreSchema = new mongoose.Schema(
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
    img: {
      type: String,
      trim: true,
      default: '',
    },
    filterGenre: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: (value) =>
          typeof value === 'string' ||
          (Array.isArray(value) && value.every((item) => typeof item === 'string')),
        message: 'filterGenre must be a string or an array of strings',
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
    collection: 'genres',
    versionKey: false,
  }
);

genreSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Genre = mongoose.models.Genre || mongoose.model('Genre', genreSchema);

module.exports = Genre;
