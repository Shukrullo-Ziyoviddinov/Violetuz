const mongoose = require('mongoose');

const concertSectionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    categoryNameMusic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    titleKey: {
      type: String,
      trim: true,
      default: '',
    },
    titleDefault: {
      type: String,
      trim: true,
      default: '',
    },
    moreTo: {
      type: String,
      trim: true,
      default: '',
    },
    wishlistType: {
      type: String,
      trim: true,
      default: 'konsert',
    },
    initialCount: {
      type: Number,
      default: 10,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    strict: true,
    collection: 'concertSections',
    versionKey: false,
  }
);

concertSectionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const ConcertSection =
  mongoose.models.ConcertSection || mongoose.model('ConcertSection', concertSectionSchema);

module.exports = ConcertSection;
