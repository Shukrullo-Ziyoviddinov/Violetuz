require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Genre = require('../models/Genre.model');
const { GENRES_JSON } = require('../config/paths');

const seedGenres = async () => {
  const raw = fs.readFileSync(GENRES_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('genres.json is empty or invalid');
  }

  await Genre.deleteMany({});

  let inserted = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const genreData = {
      ...item,
      id: String(item.id).trim(),
      sortOrder: index + 1,
    };

    const genre = new Genre(genreData);
    await genre.save();
    inserted += 1;
  }

  const ids = (await Genre.find({}, { id: 1 }).sort({ sortOrder: 1 }).lean()).map((item) => item.id);

  console.log(`Genres seeded: ${inserted}`);
  console.log(`Ids: ${ids.join(', ')}`);

  return {
    total: inserted,
    ids,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedGenres();
    process.exit(0);
  } catch (error) {
    console.error('Genre seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedGenres;
