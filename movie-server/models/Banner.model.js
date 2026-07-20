const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    lang: {
      type: String,
      required: true,
      trim: true,
      enum: ['uz', 'ru'],
      index: true,
    },
    movieId: {
      type: Number,
      required: true,
      index: true,
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    strict: true,
    collection: 'banners',
    versionKey: false,
  }
);

bannerSchema.statics.getNextId = async function getNextId() {
  const last = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (last?.id ?? 0) + 1;
};

bannerSchema.index({ lang: 1, id: 1 });

bannerSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }
  this.id = await this.constructor.getNextId();
});

bannerSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

module.exports = Banner;
