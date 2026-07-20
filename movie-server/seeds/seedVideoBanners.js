require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const VideoBanner = require('../models/VideoBanner.model');
const { VIDEO_BANNERS_JSON } = require('../config/paths');

const seedVideoBanners = async () => {
  const raw = fs.readFileSync(VIDEO_BANNERS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('videoBanners.json is empty or invalid');
  }

  await VideoBanner.deleteMany({});

  let inserted = 0;

  for (const item of items) {
    const { id: _oldId, ...data } = item;
    if (data.type) {
      data.type = String(data.type).trim().toLowerCase();
    }

    const banner = new VideoBanner(data);
    await banner.save();
    inserted += 1;
  }

  const types = [
    ...new Set((await VideoBanner.find({}, { type: 1 }).lean()).map((item) => item.type)),
  ].sort();

  const idRange = await VideoBanner.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Video banners seeded: ${inserted}`);
  console.log(`Auto ID range: ${idRange[0]?.minId} - ${idRange[0]?.maxId}`);
  console.log(`Types: ${types.join(', ')}`);

  return {
    total: inserted,
    types,
    idRange: idRange[0] || null,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedVideoBanners();
    process.exit(0);
  } catch (error) {
    console.error('Video banner seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedVideoBanners;
