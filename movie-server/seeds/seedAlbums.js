require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Album = require('../models/Album.model');
const { MUSIC_ALBUM_JSON } = require('../config/paths');

const seedAlbums = async () => {
  const raw = fs.readFileSync(MUSIC_ALBUM_JSON, 'utf8');
  const albums = JSON.parse(raw);

  if (!Array.isArray(albums) || albums.length === 0) {
    throw new Error('musicAlbom.json is empty or invalid');
  }

  await Album.deleteMany({});

  let inserted = 0;

  for (const item of albums) {
    const { id: _oldId, ...albumData } = item;
    if (albumData.categoryNameMusic) {
      albumData.categoryNameMusic = String(albumData.categoryNameMusic).trim();
    }

    const album = new Album(albumData);
    await album.save();
    inserted += 1;
  }

  const categories = [
    ...new Set(
      (await Album.find({}, { categoryNameMusic: 1 }).lean()).map((item) => item.categoryNameMusic)
    ),
  ].sort();

  const idRange = await Album.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Albums seeded: ${inserted}`);
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
    await seedAlbums();
    process.exit(0);
  } catch (error) {
    console.error('Album seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedAlbums;
