require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const MusicSection = require('../models/MusicSection.model');
const { MUSIC_SECTIONS_JSON } = require('../config/paths');

const seedMusicSections = async () => {
  const raw = fs.readFileSync(MUSIC_SECTIONS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('musicSections.json is empty or invalid');
  }

  await MusicSection.deleteMany({});

  let inserted = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const sectionData = {
      id: String(item.id).trim(),
      slug: String(item.slug || item.id).trim(),
      categoryNameMusic: String(item.categoryNameMusic).trim(),
      titleKey: item.titleKey != null ? String(item.titleKey).trim() : '',
      titleDefault: item.titleDefault != null ? String(item.titleDefault).trim() : '',
      moreTo: item.moreTo != null ? String(item.moreTo).trim() : '',
      wishlistType: item.wishlistType != null ? String(item.wishlistType).trim() : 'music',
      initialCount: Number.isFinite(Number(item.initialCount)) ? Number(item.initialCount) : 10,
      sortOrder: index + 1,
    };

    if (item.detailPathType != null && String(item.detailPathType).trim() !== '') {
      sectionData.detailPathType = String(item.detailPathType).trim();
    }

    const section = new MusicSection(sectionData);
    await section.save();
    inserted += 1;
  }

  const ids = (
    await MusicSection.find({}, { id: 1 }).sort({ sortOrder: 1 }).lean()
  ).map((item) => item.id);

  console.log(`Music sections seeded: ${inserted}`);
  console.log(`Ids: ${ids.join(', ')}`);

  return {
    total: inserted,
    ids,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedMusicSections();
    process.exit(0);
  } catch (error) {
    console.error('Music section seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedMusicSections;
