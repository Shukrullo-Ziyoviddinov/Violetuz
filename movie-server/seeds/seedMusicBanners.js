require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const MusicBanner = require('../models/MusicBanner.model');
const { MUSIC_BANNERS_JSON } = require('../config/paths');

const seedMusicBanners = async () => {
  const raw = fs.readFileSync(MUSIC_BANNERS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('musicBanners.json is empty or invalid');
  }

  await MusicBanner.deleteMany({});

  let inserted = 0;
  const seenIds = new Set();

  for (const item of items) {
    if (item.id != null) {
      if (seenIds.has(item.id)) {
        console.warn(`Skipping duplicate music banner id: ${item.id}`);
        continue;
      }
      seenIds.add(item.id);
    }

    const banner = new MusicBanner(item);
    await banner.save();
    inserted += 1;
  }

  const idRange = await MusicBanner.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Music banners seeded: ${inserted}`);
  console.log(`ID range: ${idRange[0]?.minId} - ${idRange[0]?.maxId}`);

  return {
    total: inserted,
    idRange: idRange[0] || null,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedMusicBanners();
    process.exit(0);
  } catch (error) {
    console.error('Music banner seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedMusicBanners;
