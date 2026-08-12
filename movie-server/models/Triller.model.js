const mongoose = require('mongoose');

const localizedStringSchema = new mongoose.Schema(
  {
    uz: { type: String, trim: true, default: '' },
    ru: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const descriptionLangSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, default: '' },
    year: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    genre: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const localizedDescriptionSchema = new mongoose.Schema(
  {
    uz: { type: descriptionLangSchema, default: () => ({}) },
    ru: { type: descriptionLangSchema, default: () => ({}) },
  },
  { _id: false }
);

const trillerSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    title: {
      type: localizedStringSchema,
      required: true,
      default: () => ({ uz: '', ru: '' }),
    },
    video: {
      type: localizedStringSchema,
      required: true,
      default: () => ({ uz: '', ru: '' }),
    },
    videoImg: {
      type: localizedStringSchema,
      required: true,
      default: () => ({ uz: '', ru: '' }),
    },
    trillerGenre: {
      type: localizedStringSchema,
      required: true,
      default: () => ({ uz: '', ru: '' }),
    },
    description: {
      type: localizedDescriptionSchema,
      default: () => ({ uz: {}, ru: {} }),
    },
    ageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    like: {
      type: Number,
      default: 0,
      min: 0,
    },
    dislike: {
      type: Number,
      default: 0,
      min: 0,
    },
    reytingImdb: {
      type: Number,
      default: 0,
      min: 0,
    },
    reytingKinopoisk: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    strict: true,
    collection: 'trillers',
    versionKey: false,
  }
);

trillerSchema.statics.getNextId = async function getNextId() {
  const last = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (last?.id ?? 0) + 1;
};

trillerSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }
  this.id = await this.constructor.getNextId();
});

trillerSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Triller = mongoose.models.Triller || mongoose.model('Triller', trillerSchema);

module.exports = Triller;
