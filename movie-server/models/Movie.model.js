const mongoose = require('mongoose');

const localizedStringSchema = new mongoose.Schema(
  {
    uz: { type: String, trim: true, default: '' },
    ru: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const mediaAssetSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true, default: '' },
    src: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const localizedVideoSchema = new mongoose.Schema(
  {
    video: { type: mediaAssetSchema, default: () => ({}) },
  },
  { _id: false }
);

const trailerItemSchema = new mongoose.Schema(
  {
    id: { type: Number, default: null },
    trailers: { type: localizedStringSchema, default: () => ({}) },
    title: { type: localizedStringSchema, default: () => ({}) },
    text: { type: localizedStringSchema, default: () => ({}) },
    like: { type: String, trim: true, default: '' },
    dislike: { type: String, trim: true, default: '' },
    typeTrailers: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const clipItemSchema = new mongoose.Schema(
  {
    id: { type: Number, default: null },
    src: { type: String, trim: true, default: '' },
    title: { type: localizedStringSchema, default: () => ({}) },
  },
  { _id: false }
);

const seasonItemSchema = new mongoose.Schema(
  {
    seasonNumber: { type: Number, default: null },
    title: { type: localizedStringSchema, default: () => ({}) },
    episodes: { type: [localizedStringSchema], default: [] },
  },
  { _id: false }
);

const specsSchema = new mongoose.Schema(
  {
    duration: { type: Number, default: null },
    ageRating: { type: String, trim: true, default: '' },
    year: { type: Number, default: null },
    countries: { type: [String], default: [] },
    languages: { type: [String], default: [] },
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    categoryName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: localizedStringSchema,
      required: true,
    },
    homeImg: {
      type: localizedStringSchema,
      default: () => ({}),
    },
    movieMedia: {
      uz: { type: localizedVideoSchema, default: () => ({}) },
      ru: { type: localizedVideoSchema, default: () => ({}) },
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingImdb: {
      type: Number,
      default: 0,
    },
    ratingKinopoisk: {
      type: Number,
      default: 0,
    },
    ratingNetflix: {
      type: Number,
      default: null,
    },
    ageRestriction: {
      type: Number,
      default: null,
    },
    genre: {
      uz: { type: [String], default: [] },
      ru: { type: [String], default: [] },
    },
    description: {
      uz: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({}),
        validate: {
          validator: (value) =>
            typeof value === 'string' ||
            (value !== null && typeof value === 'object' && !Array.isArray(value)),
          message: 'description.uz must be string or object',
        },
      },
      ru: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({}),
        validate: {
          validator: (value) =>
            typeof value === 'string' ||
            (value !== null && typeof value === 'object' && !Array.isArray(value)),
          message: 'description.ru must be string or object',
        },
      },
    },
    trailersVideo: {
      type: [trailerItemSchema],
      default: [],
    },
    watchVideo: {
      type: localizedStringSchema,
      default: () => ({}),
    },
    seasons: {
      type: [seasonItemSchema],
      default: null,
    },
    actors: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
      validate: {
        validator: (values) =>
          Array.isArray(values) &&
          values.every((item) => typeof item === 'number' || typeof item === 'string'),
        message: 'actors must contain only number or string values',
      },
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    typeCategory: {
      type: [String],
      default: [],
    },
    filterCountry: {
      type: String,
      trim: true,
      default: '',
    },
    filterGenre: {
      type: [String],
      default: [],
    },
    like: {
      type: String,
      trim: true,
      default: '',
    },
    dislike: {
      type: String,
      trim: true,
      default: '',
    },
    specs: {
      type: specsSchema,
      default: () => ({}),
    },
    titleImg: {
      type: localizedStringSchema,
      default: () => ({}),
    },
    type: {
      type: String,
      trim: true,
      default: '',
    },
    scenes: {
      type: [String],
      default: [],
    },
    clips: {
      type: [clipItemSchema],
      default: [],
    },
  },
  {
    strict: true,
    collection: 'movies',
    versionKey: false,
    timestamps: true,
  }
);

movieSchema.statics.getNextId = async function getNextId() {
  const lastMovie = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (lastMovie?.id ?? 0) + 1;
};

movieSchema.index({ categoryName: 1, id: 1 });

movieSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }

  this.id = await this.constructor.getNextId();
});

movieSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);

module.exports = Movie;
