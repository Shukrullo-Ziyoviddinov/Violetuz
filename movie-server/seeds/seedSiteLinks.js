require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const SiteLinks = require('../models/SiteLinks.model');
const { SOCIAL_LINKS_JSON } = require('../config/paths');

const seedSiteLinks = async () => {
  const raw = fs.readFileSync(SOCIAL_LINKS_JSON, 'utf8');
  const data = JSON.parse(raw);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('socialLinks.json is empty or invalid');
  }

  await SiteLinks.deleteMany({});

  const doc = new SiteLinks({
    id: String(data.id || 'site').trim() || 'site',
    contact: data.contact || {},
    socialLinks: data.socialLinks || {},
    appStoreLinks: data.appStoreLinks || {},
  });
  await doc.save();

  console.log(`Site links seeded: id=${doc.id}`);
  console.log(`contact keys: ${Object.keys(doc.contact || {}).join(', ')}`);
  console.log(`social keys: ${Object.keys(doc.socialLinks || {}).join(', ')}`);
  console.log(`appStore keys: ${Object.keys(doc.appStoreLinks || {}).join(', ')}`);

  return {
    id: doc.id,
    contactKeys: Object.keys(doc.contact || {}),
    socialKeys: Object.keys(doc.socialLinks || {}),
    appStoreKeys: Object.keys(doc.appStoreLinks || {}),
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedSiteLinks();
    process.exit(0);
  } catch (error) {
    console.error('Site links seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedSiteLinks;
