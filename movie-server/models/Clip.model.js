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
    /** Shu klipning asosiy qo'shig'i. Bo'sh bo'lsa bog'lanish yo'q. albumId yo'q. */
    musicId: {
      type: Number,
      default: null,
    },
    /**
     * Franshiza / seriya kliplar (music-similar QATLAM 1).
     * Tartib: arrayda birinchi id — eng yuqori. Ba'zi yozuvlarda bo'sh.
     */
    franchiseClipIds: {
      type: [Number],
      default: [],
    },
    /**
     * Klip soundtracki olingan kinolar. movie.json dagi kino id lari.
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
    collection: 'clips',
    versionKey: false,
    timestamps: true,
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
