const mongoose = require('mongoose');

const concertSchema = new mongoose.Schema(
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
      default: 'konsert',
      index: true,
    },
    /** Shu konsertning asosiy qo'shig'i. Bo'sh bo'lsa bog'lanish yo'q. albumId yo'q. */
    musicId: {
      type: Number,
      default: null,
    },
    /**
     * Konsert videosi biriktirilgan kinolar. movie.json dagi kino id lari.
     * Tartib: arraydagi tartib chiqish tartibi. Bo‘sh bo‘lsa [].
     */
    movieId: {
      type: [Number],
      default: [],
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
    collection: 'concerts',
    versionKey: false,
    timestamps: true,
  }
);

concertSchema.statics.getNextId = async function getNextId() {
  const lastConcert = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (lastConcert?.id ?? 0) + 1;
};

concertSchema.index({ categoryNameMusic: 1, id: 1 });
concertSchema.index({ artistId: 1, id: 1 });
concertSchema.index({ type: 1, id: 1 });

concertSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }

  this.id = await this.constructor.getNextId();
});

concertSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Concert = mongoose.models.Concert || mongoose.model('Concert', concertSchema);

module.exports = Concert;
