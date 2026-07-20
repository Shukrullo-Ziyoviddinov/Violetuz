require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Clip = require('../models/Clip.model');
const { KLIPS_JSON } = require('../config/paths');

const seedClips = async () => {
  const raw = fs.readFileSync(KLIPS_JSON, 'utf8');
  const clips = JSON.parse(raw);

  if (!Array.isArray(clips) || clips.length === 0) {
    throw new Error('klips.json is empty or invalid');
  }

  await Clip.deleteMany({});

  let inserted = 0;

  for (const item of clips) {
    const { id: _oldId, ...clipData } = item;
    if (clipData.categoryNameMusic) {
      clipData.categoryNameMusic = String(clipData.categoryNameMusic).trim();
    }
    if (clipData.type) {
      clipData.type = String(clipData.type).trim();
    }

    const clip = new Clip(clipData);
    await clip.save();
    inserted += 1;
  }

  const categories = [
    ...new Set(
      (await Clip.find({}, { categoryNameMusic: 1 }).lean()).map((item) => item.categoryNameMusic)
    ),
  ].sort();

  const idRange = await Clip.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Clips seeded: ${inserted}`);
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
    await seedClips();
    process.exit(0);
  } catch (error) {
    console.error('Clip seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedClips;
