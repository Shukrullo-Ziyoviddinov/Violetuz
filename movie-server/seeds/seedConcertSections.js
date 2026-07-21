require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const ConcertSection = require('../models/ConcertSection.model');
const { CONCERT_SECTIONS_JSON } = require('../config/paths');

const seedConcertSections = async () => {
  const raw = fs.readFileSync(CONCERT_SECTIONS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('concertSections.json is empty or invalid');
  }

  await ConcertSection.deleteMany({});

  let inserted = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const sectionData = {
      ...item,
      id: String(item.id).trim(),
      slug: String(item.slug || item.id).trim(),
      categoryNameMusic: String(item.categoryNameMusic).trim(),
      sortOrder: index + 1,
    };

    const section = new ConcertSection(sectionData);
    await section.save();
    inserted += 1;
  }

  const ids = (
    await ConcertSection.find({}, { id: 1 }).sort({ sortOrder: 1 }).lean()
  ).map((item) => item.id);

  console.log(`Concert sections seeded: ${inserted}`);
  console.log(`Ids: ${ids.join(', ')}`);

  return {
    total: inserted,
    ids,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedConcertSections();
    process.exit(0);
  } catch (error) {
    console.error('Concert section seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedConcertSections;
