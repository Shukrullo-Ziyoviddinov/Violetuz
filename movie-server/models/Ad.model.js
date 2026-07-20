const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    strict: true,
    collection: 'ads',
    versionKey: false,
  }
);

adSchema.statics.getNextId = async function getNextId() {
  const last = await this.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
  return (last?.id ?? 0) + 1;
};

adSchema.pre('validate', async function assignAutoId() {
  if (!this.isNew || this.id != null) {
    return;
  }
  this.id = await this.constructor.getNextId();
});

adSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const Ad = mongoose.models.Ad || mongoose.model('Ad', adSchema);

module.exports = Ad;
