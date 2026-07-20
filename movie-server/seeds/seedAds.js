require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Ad = require('../models/Ad.model');
const { ADS_JSON } = require('../config/paths');

const seedAds = async () => {
  const raw = fs.readFileSync(ADS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('ads.json is empty or invalid');
  }

  await Ad.deleteMany({});

  let inserted = 0;

  for (const item of items) {
    const { id: _oldId, ...data } = item;
    const ad = new Ad(data);
    await ad.save();
    inserted += 1;
  }

  const idRange = await Ad.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Ads seeded: ${inserted}`);
  console.log(`Auto ID range: ${idRange[0]?.minId} - ${idRange[0]?.maxId}`);

  return {
    total: inserted,
    idRange: idRange[0] || null,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedAds();
    process.exit(0);
  } catch (error) {
    console.error('Ad seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedAds;
