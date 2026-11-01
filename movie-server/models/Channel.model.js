const mongoose = require('mongoose');

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;

const socialLinkSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const biografiyaLinkSchema = new mongoose.Schema(
  {
    instagram: { type: socialLinkSchema, default: () => ({}) },
    telegram: { type: socialLinkSchema, default: () => ({}) },
    tiktok: { type: socialLinkSchema, default: () => ({}) },
    youtube: { type: socialLinkSchema, default: () => ({}) },
  },
  { _id: false }
);

const biografiyaSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, default: '' },
    link: { type: biografiyaLinkSchema, default: () => ({}) },
  },
  { _id: false }
);

/** Har bir rasmga Mongo o‘zi _id beradi. JSON da id yozilmaydi. */
const profileBannerItemSchema = new mongoose.Schema({
  image: { type: String, trim: true, default: '' },
});

const profileBannerSchema = new mongoose.Schema(
  {
    banners: { type: [profileBannerItemSchema], default: [] },
  },
  { _id: false }
);

const channelSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    /** Ekrandagi @username. Harf katta-kichikligi saqlanadi. */
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
      validate: {
        validator(value) {
          return USERNAME_RE.test(String(value || ''));
        },
        message: 'Username 3–30 belgi: harf, raqam, _ yoki .',
      },
    },
    /** Bandlik tekshiruvi shu maydonda. Userlardagi usernameNormalized bilan bir xil qoida. */
    usernameNormalized: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    avatar: {
      type: String,
      trim: true,
      default: '',
    },
    profileBanner: {
      type: profileBannerSchema,
      default: () => ({ banners: [] }),
    },
    biografiya: {
      type: biografiyaSchema,
      default: () => ({}),
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    /** Sahifada ko‘rinadigan obunachi soni. Aktor va artistdagi maydon bilan bir xil. */
    subscribers: {
      type: Number,
      default: 0,
    },
  },
  {
    strict: true,
    collection: 'channels',
    versionKey: false,
  }
);

channelSchema.pre('validate', function normalizeChannelUsername() {
  const username = String(this.username || '').trim().replace(/^@+/, '');
  this.username = username;
  this.usernameNormalized = username.toLowerCase();
});

const toPublicBanner = (item) => ({
  id: item?._id ? String(item._id) : String(item?.id || ''),
  image: item?.image || '',
});

channelSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, usernameNormalized, profileBanner, ...rest } = ret;
    const banners = Array.isArray(profileBanner?.banners)
      ? profileBanner.banners.map(toPublicBanner).filter((item) => item.image)
      : [];
    return { ...rest, profileBanner: { banners } };
  },
});

const Channel = mongoose.models.Channel || mongoose.model('Channel', channelSchema);

module.exports = Channel;
