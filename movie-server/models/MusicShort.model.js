const mongoose = require('mongoose');

const localizedStringSchema = new mongoose.Schema(
  {
    uz: { type: String, trim: true, default: '' },
    ru: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const musicShortSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    video: {
      type: localizedStringSchema,
      required: true,
    },
    description: {
      type: localizedStringSchema,
      default: () => ({ uz: '', ru: '' }),
    },
    musicId: {
      type: Number,
      required: true,
      index: true,
    },
    artistId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    movieId: {
      type: Number,
      default: null,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      trim: true,
      enum: ['music', 'klip', 'konsert'],
      index: true,
    },
    type: {
      type: String,
      trim: true,
      default: 'musicshorts',
      index: true,
    },
  },
  {
    strict: true,
    collection: 'musicShorts',
    versionKey: false,
  }
);

musicShortSchema.statics.getNextId = async function getNextId() {
  const last = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (last?.id ?? 10000) + 1;
};

musicShortSchema.index({ contentType: 1, musicId: 1 });
musicShortSchema.index({ artistId: 1, id: 1 });

musicShortSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }
  this.id = await this.constructor.getNextId();
});

musicShortSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const MusicShort =
  mongoose.models.MusicShort || mongoose.model('MusicShort', musicShortSchema);

module.exports = MusicShort;
