const mongoose = require('mongoose');

const siteLinksSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: 'site',
      index: true,
    },
    contact: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    socialLinks: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    appStoreLinks: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    strict: true,
    collection: 'siteLinks',
    versionKey: false,
  }
);

siteLinksSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

const SiteLinks = mongoose.models.SiteLinks || mongoose.model('SiteLinks', siteLinksSchema);

module.exports = SiteLinks;
