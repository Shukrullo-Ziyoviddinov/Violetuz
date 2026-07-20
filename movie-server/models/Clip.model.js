const mongoose = require('mongoose');

const clipSchema = new mongoose.Schema(
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
      default: 'klip',
      index: true,
    },
    video: {
      type: String,
      trim: true,
      default: '',
    },
    like: {
      type: String,
      trim: true,
      default: '0',
    },
    dislike: {
      type: String,
      trim: true,
      default: '0',
    },
  },
  {
    strict: true,
    collection: 'clips',
    versionKey: false,
  }
);

clipSchema.statics.getNextId = async function getNextId() {
  const lastClip = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (lastClip?.id ?? 0) + 1;
};

clipSchema.index({ categoryNameMusic: 1, id: 1 });
clipSchema.index({ artistId: 1, id: 1 });
clipSchema.index({ type: 1, id: 1 });

clipSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }

  this.id = await this.constructor.getNextId();
});

clipSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Clip = mongoose.models.Clip || mongoose.model('Clip', clipSchema);

module.exports = Clip;
