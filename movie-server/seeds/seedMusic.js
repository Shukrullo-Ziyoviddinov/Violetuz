require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Music = require('../models/Music.model');
const { MUSIC_JSON } = require('../config/paths');

const seedMusic = async () => {
  const raw = fs.readFileSync(MUSIC_JSON, 'utf8');
  const musicList = JSON.parse(raw);

  if (!Array.isArray(musicList) || musicList.length === 0) {
    throw new Error('music.json is empty or invalid');
  }

  await Music.deleteMany({});

  let inserted = 0;

  for (const item of musicList) {
    const musicData = { ...item };
    if (musicData.categoryNameMusic) {
      musicData.categoryNameMusic = String(musicData.categoryNameMusic).trim();
    }

    const music = new Music(musicData);
    await music.save();
    inserted += 1;
  }

  const categories = [
    ...new Set(
      (await Music.find({}, { categoryNameMusic: 1 }).lean()).map((item) => item.categoryNameMusic)
    ),
  ].sort();

  const idRange = await Music.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Music seeded: ${inserted}`);
  console.log(`Auto ID range: ${idRange[0]?.minId} - ${idRange[0]?.maxId}`);
  console.log(`Categories: ${categories.join(', ')}`);

  return {
    total: inserted,
    categories,
    idRange: idRange[0] || null,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedMusic();
    process.exit(0);
  } catch (error) {
    console.error('Music seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedMusic;
