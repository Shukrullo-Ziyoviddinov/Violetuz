const mongoose = require('mongoose');

const localizedStringSchema = new mongoose.Schema(
  {
    uz: { type: String, trim: true, default: '' },
    ru: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const actorPageLabelSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: localizedStringSchema,
      required: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    strict: true,
    collection: 'actorPageLabels',
    versionKey: false,
  }
);

actorPageLabelSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const ActorPageLabel =
  mongoose.models.ActorPageLabel || mongoose.model('ActorPageLabel', actorPageLabelSchema);

module.exports = ActorPageLabel;
