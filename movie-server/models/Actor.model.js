const mongoose = require('mongoose');

const localizedStringSchema = new mongoose.Schema(
  {
    uz: { type: String, trim: true, default: '' },
    ru: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const videoDraphyItemSchema = new mongoose.Schema(
  {
    id: { type: Number, default: null },
    src: { type: String, trim: true, default: '' },
    title: { type: localizedStringSchema, default: () => ({}) },
    like: { type: String, trim: true, default: '' },
    dislike: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const awardItemSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true, default: '' },
    title: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    work: { type: String, trim: true, default: '' },
    year: { type: Number, default: null },
    image: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const bioSchema = new mongoose.Schema(
  {
    text: { type: localizedStringSchema, default: () => ({}) },
    bioImg: { type: [String], default: [] },
  },
  { _id: false }
);

const actorSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    name: {
      type: localizedStringSchema,
      required: true,
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    backgroundImg: {
      type: String,
      trim: true,
      default: '',
    },
    birthDate: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: localizedStringSchema,
      default: () => ({}),
    },
    city: {
      type: localizedStringSchema,
      default: () => ({}),
    },
    genres: {
      uz: { type: [String], default: [] },
      ru: { type: [String], default: [] },
    },
    bio: {
      type: bioSchema,
      default: () => ({}),
    },
    photoGallery: {
      type: [String],
      default: [],
    },
    videoDraphy: {
      type: [videoDraphyItemSchema],
      default: [],
    },
    actorsGenre: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    awards: {
      type: [awardItemSchema],
      default: [],
    },
    subscribers: {
      type: Number,
      default: 0,
    },
  },
  {
    strict: true,
    collection: 'actors',
    versionKey: false,
  }
);

actorSchema.statics.getNextId = async function getNextId() {
  const lastActor = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (lastActor?.id ?? 0) + 1;
};

actorSchema.index({ actorsGenre: 1, id: 1 });

actorSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }

  this.id = await this.constructor.getNextId();
});

actorSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Actor = mongoose.models.Actor || mongoose.model('Actor', actorSchema);

module.exports = Actor;
