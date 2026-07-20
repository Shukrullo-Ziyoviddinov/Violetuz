const mongoose = require('mongoose');

const localizedStringSchema = new mongoose.Schema(
  {
    uz: { type: String, trim: true, default: '' },
    ru: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const shortsMusicsRefSchema = new mongoose.Schema(
  {
    musicId: { type: Number },
    videoId: { type: Number },
  },
  { _id: false }
);

const shortVideoSchema = new mongoose.Schema(
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
    movieId: {
      type: Number,
      required: true,
      index: true,
    },
    type: {
      type: String,
      trim: true,
      default: 'movieShorts',
      index: true,
    },
    musics: {
      type: shortsMusicsRefSchema,
      required: false,
    },
  },
  {
    strict: true,
    collection: 'shortsVideos',
    versionKey: false,
  }
);

shortVideoSchema.statics.getNextId = async function getNextId() {
  const last = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (last?.id ?? 0) + 1;
};

shortVideoSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }
  this.id = await this.constructor.getNextId();
});

shortVideoSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const ShortVideo = mongoose.models.ShortVideo || mongoose.model('ShortVideo', shortVideoSchema);

module.exports = ShortVideo;
