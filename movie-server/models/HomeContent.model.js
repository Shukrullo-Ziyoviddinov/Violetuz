const mongoose = require('mongoose');

/**
 * Home page layout document (NOT a movie section catalog).
 * One doc holds ordered UI blocks for the home page.
 */
const homeContentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: 'home',
      index: true,
    },
    blocks: {
      type: [
        {
          type: {
            type: String,
            required: true,
            trim: true,
          },
          sectionId: {
            type: String,
            trim: true,
          },
          variant: {
            type: String,
            trim: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    strict: true,
    collection: 'homeContent',
    versionKey: false,
  }
);

homeContentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const HomeContent =
  mongoose.models.HomeContent || mongoose.model('HomeContent', homeContentSchema);

module.exports = HomeContent;
