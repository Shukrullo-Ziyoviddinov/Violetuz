const mongoose = require('mongoose');

const artistMusicStorySchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    artistId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    artistMusicId: {
      type: Number,
      required: true,
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
    audio: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    strict: true,
    collection: 'artistMusicStories',
    versionKey: false,
  }
);

artistMusicStorySchema.statics.getNextId = async function getNextId() {
  const last = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (last?.id ?? 0) + 1;
};

artistMusicStorySchema.index({ artistId: 1, id: 1 });

artistMusicStorySchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }
  this.id = await this.constructor.getNextId();
});

artistMusicStorySchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const ArtistMusicStory =
  mongoose.models.ArtistMusicStory ||
  mongoose.model('ArtistMusicStory', artistMusicStorySchema);

module.exports = ArtistMusicStory;
