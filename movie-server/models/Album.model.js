const mongoose = require('mongoose');

const albumSongSchema = new mongoose.Schema(
  {
    id: { type: Number, default: null },
    title: { type: String, trim: true, default: '' },
    artist: { type: String, trim: true, default: '' },
    audio: { type: String, trim: true, default: '' },
    lyricsText: { type: String, default: '' },
    /** Shu qo‘shiqning kliplari: oddiy klip va mood-klip. Bo‘sh bo‘lsa bog‘lanish yo‘q. */
    clipIds: { type: [Number], default: [] },
  },
  { _id: false }
);

const albumSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    /**
     * Albom qaysi kanalga tegishli. channels.json dagi id.
     * Bo'sh bo'lsa kanal profiliga chiqmaydi.
     */
    channelId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    categoryNameMusic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      trim: true,
      default: '',
    },
    /**
     * artists.json dagi artist id lari. Bir albomda bir nechta artist.
     * Bo'sh bo'lsa [].
     */
    artistId: {
      type: [String],
      default: [],
      index: true,
    },
    img: {
      type: String,
      trim: true,
      default: '',
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
      default: 'musicAlbom',
    },
    songs: {
      type: [albumSongSchema],
      default: [],
    },
  },
  {
    strict: true,
    collection: 'musicAlbums',
    versionKey: false,
  }
);

albumSchema.statics.getNextId = async function getNextId() {
  const lastAlbum = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (lastAlbum?.id ?? 0) + 1;
};

albumSchema.index({ categoryNameMusic: 1, id: 1 });
albumSchema.index({ artistId: 1, id: 1 });

albumSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }

  this.id = await this.constructor.getNextId();
});

albumSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Album = mongoose.models.Album || mongoose.model('Album', albumSchema);

module.exports = Album;
