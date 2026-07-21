require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const ClipSection = require('../models/ClipSection.model');
const { CLIP_SECTIONS_JSON } = require('../config/paths');

const seedClipSections = async () => {
  const raw = fs.readFileSync(CLIP_SECTIONS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('clipSections.json is empty or invalid');
  }

  await ClipSection.deleteMany({});

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
      wishlistType: item.wishlistType != null ? String(item.wishlistType).trim() : 'klip',
      initialCount: Number.isFinite(Number(item.initialCount)) ? Number(item.initialCount) : 10,
      sortOrder: index + 1,
    };

    const section = new ClipSection(sectionData);
    await section.save();
    inserted += 1;
  }

  const ids = (
    await ClipSection.find({}, { id: 1 }).sort({ sortOrder: 1 }).lean()
  ).map((item) => item.id);

  console.log(`Clip sections seeded: ${inserted}`);
  console.log(`sortOrder range: 1 - ${inserted}`);
  console.log(`Ids: ${ids.join(', ')}`);

  return {
    total: inserted,
    ids,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedClipSections();
    process.exit(0);
  } catch (error) {
    console.error('Clip section seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedClipSections;
