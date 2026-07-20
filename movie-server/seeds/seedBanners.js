require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Banner = require('../models/Banner.model');
const { BANNERS_JSON } = require('../config/paths');

const seedBanners = async () => {
  const raw = fs.readFileSync(BANNERS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('banners.json is empty or invalid');
  }

  await Banner.deleteMany({});

  let inserted = 0;

  for (const item of items) {
    const { id: _oldId, ...data } = item;
    if (data.lang) {
      data.lang = String(data.lang).trim();
    }

    const banner = new Banner(data);
    await banner.save();
    inserted += 1;
  }

  const langs = [
    ...new Set((await Banner.find({}, { lang: 1 }).lean()).map((item) => item.lang)),
  ].sort();

  const idRange = await Banner.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Banners seeded: ${inserted}`);
  console.log(`Auto ID range: ${idRange[0]?.minId} - ${idRange[0]?.maxId}`);
  console.log(`Languages: ${langs.join(', ')}`);

  return {
    total: inserted,
    langs,
    idRange: idRange[0] || null,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedBanners();
    process.exit(0);
  } catch (error) {
    console.error('Banner seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedBanners;
