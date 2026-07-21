require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const MovieSection = require('../models/MovieSection.model');
const { MOVIE_SECTIONS_JSON } = require('../config/paths');

const seedMovieSections = async () => {
  const raw = fs.readFileSync(MOVIE_SECTIONS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('movieSections.json is empty or invalid');
  }

  await MovieSection.deleteMany({});

  let inserted = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const sectionData = {
      ...item,
      id: String(item.id).trim(),
      slug: String(item.slug || item.id).trim(),
      categoryName: String(item.categoryName).trim(),
      titleKey: String(item.titleKey).trim(),
      showHorizontalScroll: item.showHorizontalScroll !== false,
      sortOrder: index + 1,
    };

    const section = new MovieSection(sectionData);
    await section.save();
    inserted += 1;
  }

  const ids = (
    await MovieSection.find({}, { id: 1 }).sort({ sortOrder: 1 }).lean()
  ).map((item) => item.id);

  console.log(`Movie sections seeded: ${inserted}`);
  console.log(`Ids: ${ids.join(', ')}`);

  return {
    total: inserted,
    ids,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedMovieSections();
    process.exit(0);
  } catch (error) {
    console.error('Movie section seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedMovieSections;
