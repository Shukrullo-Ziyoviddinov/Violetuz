const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    categoryNameMusic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    artistId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    img: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      default: null,
    },
    genre: {
      type: String,
      trim: true,
      default: '',
    },
    language: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      trim: true,
      default: 'music',
    },
    audio: {
      type: String,
      trim: true,
      default: '',
    },
    lyricsText: {
      type: String,
      default: '',
    },
  },
  {
    strict: true,
    collection: 'music',
    versionKey: false,
  }
);

musicSchema.statics.getNextId = async function getNextId() {
  const lastMusic = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (lastMusic?.id ?? 0) + 1;
};

musicSchema.index({ categoryNameMusic: 1, id: 1 });
musicSchema.index({ artistId: 1, id: 1 });

musicSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }

  this.id = await this.constructor.getNextId();
});

musicSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Music = mongoose.models.Music || mongoose.model('Music', musicSchema);

module.exports = Music;
