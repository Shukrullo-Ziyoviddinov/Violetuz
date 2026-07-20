const mongoose = require('mongoose');

const localizedStringSchema = new mongoose.Schema(
  {
    uz: { type: String, trim: true, default: '' },
    ru: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const videoBannerSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ['movie', 'music'],
      index: true,
    },
    refId: {
      type: Number,
      required: true,
      index: true,
    },
    video: {
      type: String,
      required: true,
      trim: true,
    },
    titleImage: {
      type: localizedStringSchema,
      required: false,
    },
    nameImg: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    strict: true,
    collection: 'videoBanners',
    versionKey: false,
  }
);

videoBannerSchema.statics.getNextId = async function getNextId() {
  const last = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (last?.id ?? 0) + 1;
};

videoBannerSchema.index({ type: 1, id: 1 });

videoBannerSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }
  this.id = await this.constructor.getNextId();
});

videoBannerSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const VideoBanner =
  mongoose.models.VideoBanner || mongoose.model('VideoBanner', videoBannerSchema);

module.exports = VideoBanner;
