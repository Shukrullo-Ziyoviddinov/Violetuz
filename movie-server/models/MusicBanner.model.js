const mongoose = require('mongoose');

const musicBannerSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    img: {
      type: String,
      required: true,
      trim: true,
    },
    buttonId: {
      type: Number,
      required: true,
      index: true,
    },
  },
  {
    strict: true,
    collection: 'musicBanners',
    versionKey: false,
  }
);

musicBannerSchema.statics.getNextId = async function getNextId() {
  const last = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (last?.id ?? 0) + 1;
};

musicBannerSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }
  this.id = await this.constructor.getNextId();
});

musicBannerSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const MusicBanner =
  mongoose.models.MusicBanner || mongoose.model('MusicBanner', musicBannerSchema);

module.exports = MusicBanner;
