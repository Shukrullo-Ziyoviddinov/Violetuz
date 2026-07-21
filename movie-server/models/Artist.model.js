const mongoose = require('mongoose');

const artistBioSchema = new mongoose.Schema(
  {
    text: { type: String, default: '' },
    bioImg: { type: [String], default: [] },
  },
  { _id: false }
);

const artistSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    img: {
      type: String,
      trim: true,
      default: '',
    },
    imgArtist: {
      type: String,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subscribers: {
      type: Number,
      default: 0,
    },
    birthDate: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    genres: {
      type: [String],
      default: [],
    },
    bio: {
      type: artistBioSchema,
      default: () => ({ text: '', bioImg: [] }),
    },
    photoGallery: {
      type: [String],
      default: [],
    },
  },
  {
    strict: true,
    collection: 'artists',
    versionKey: false,
  }
);

artistSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Artist = mongoose.models.Artist || mongoose.model('Artist', artistSchema);

module.exports = Artist;
