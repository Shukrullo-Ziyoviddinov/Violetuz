require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const ShortVideo = require('../models/ShortVideo.model');
const { SHORTS_VIDEOS_JSON } = require('../config/paths');

const seedShortVideos = async () => {
  const raw = fs.readFileSync(SHORTS_VIDEOS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('shortsVideos.json is empty or invalid');
  }

  await ShortVideo.deleteMany({});

  let inserted = 0;

  for (const item of items) {
    const { id: _oldId, ...data } = item;
    if (data.type) {
      data.type = String(data.type).trim();
    } else {
      data.type = 'movieShorts';
    }

    const short = new ShortVideo(data);
    await short.save();
    inserted += 1;
  }

  const idRange = await ShortVideo.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Short videos seeded: ${inserted}`);
  console.log(`Auto ID range: ${idRange[0]?.minId} - ${idRange[0]?.maxId}`);

  return {
    total: inserted,
    idRange: idRange[0] || null,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedShortVideos();
    process.exit(0);
  } catch (error) {
    console.error('Short video seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedShortVideos;
