require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Artist = require('../models/Artist.model');
const { ARTISTS_JSON } = require('../config/paths');

const seedArtists = async () => {
  const raw = fs.readFileSync(ARTISTS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('artists.json is empty or invalid');
  }

  await Artist.deleteMany({});

  let inserted = 0;
  const seenIds = new Set();

  for (const item of items) {
    const id = String(item.id || '').trim();
    if (!id) {
      console.warn('Skipping artist without id');
      continue;
    }
    if (seenIds.has(id)) {
      console.warn(`Skipping duplicate artist id: ${id}`);
      continue;
    }
    seenIds.add(id);

    const artist = new Artist({
      ...item,
      id,
    });
    await artist.save();
    inserted += 1;
  }

  const ids = (await Artist.find({}, { id: 1 }).sort({ name: 1 }).lean()).map((item) => item.id);

  console.log(`Artists seeded: ${inserted}`);
  console.log(`Ids: ${ids.join(', ')}`);

  return { total: inserted, ids };
};

const run = async () => {
  try {
    await connectDB();
    await seedArtists();
    process.exit(0);
  } catch (error) {
    console.error('Artist seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedArtists;
