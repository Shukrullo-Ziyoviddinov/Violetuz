require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const MusicShort = require('../models/MusicShort.model');
const { MUSIC_SHORTS_JSON } = require('../config/paths');

const seedMusicShorts = async () => {
  const raw = fs.readFileSync(MUSIC_SHORTS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('musicShorts.json is empty or invalid');
  }

  await MusicShort.deleteMany({});

  let inserted = 0;
  const seenIds = new Set();

  for (const item of items) {
    if (item.id != null) {
      if (seenIds.has(item.id)) {
        console.warn(`Skipping duplicate music short id: ${item.id}`);
        continue;
      }
      seenIds.add(item.id);
    }

    const data = { ...item };
    if (data.contentType) {
      data.contentType = String(data.contentType).trim().toLowerCase();
    }
    if (data.type) {
      data.type = String(data.type).trim();
    } else {
      data.type = 'musicshorts';
    }
    if (data.artistId) {
      data.artistId = String(data.artistId).trim();
    }
    if (data.video?.uz && !String(data.video.uz).startsWith('/')) {
      data.video.uz = `/${data.video.uz}`;
    }
    if (data.video?.ru && !String(data.video.ru).startsWith('/')) {
      data.video.ru = `/${data.video.ru}`;
    }

    const short = new MusicShort(data);
    await short.save();
    inserted += 1;
  }

  const contentTypes = [
    ...new Set(
      (await MusicShort.find({}, { contentType: 1 }).lean()).map((item) => item.contentType)
    ),
  ].sort();

  const idRange = await MusicShort.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Music shorts seeded: ${inserted}`);
  console.log(`ID range: ${idRange[0]?.minId} - ${idRange[0]?.maxId}`);
  console.log(`contentTypes: ${contentTypes.join(', ')}`);

  return {
    total: inserted,
    contentTypes,
    idRange: idRange[0] || null,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedMusicShorts();
    process.exit(0);
  } catch (error) {
    console.error('Music short seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedMusicShorts;
