require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Movie = require('../models/Movie.model');
const { MOVIES_JSON } = require('../config/paths');

const seedMovies = async () => {
  const raw = fs.readFileSync(MOVIES_JSON, 'utf8');
  const movies = JSON.parse(raw);

  if (!Array.isArray(movies) || movies.length === 0) {
    throw new Error('movie.json is empty or invalid');
  }

  await Movie.deleteMany({});

  let inserted = 0;

  for (const item of movies) {
    const { id: _oldId, ...movieData } = item;
    const movie = new Movie(movieData);
    await movie.save();
    inserted += 1;
  }

  const categories = [...new Set(movies.map((movie) => movie.categoryName))].sort();
  const idRange = await Movie.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Movies seeded: ${inserted}`);
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
    await seedMovies();
    process.exit(0);
  } catch (error) {
    console.error('Movie seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedMovies;
