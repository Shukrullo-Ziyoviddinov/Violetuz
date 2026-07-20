require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Concert = require('../models/Concert.model');
const { KONSERT_JSON } = require('../config/paths');

const seedConcerts = async () => {
  const raw = fs.readFileSync(KONSERT_JSON, 'utf8');
  const concerts = JSON.parse(raw);

  if (!Array.isArray(concerts) || concerts.length === 0) {
    throw new Error('konsert.json is empty or invalid');
  }

  await Concert.deleteMany({});

  let inserted = 0;

  for (const item of concerts) {
    const { id: _oldId, ...concertData } = item;
    if (concertData.categoryNameMusic) {
      concertData.categoryNameMusic = String(concertData.categoryNameMusic).trim();
    }
    if (concertData.type) {
      concertData.type = String(concertData.type).trim();
    } else {
      concertData.type = 'konsert';
    }

    const concert = new Concert(concertData);
    await concert.save();
    inserted += 1;
  }

  const categories = [
    ...new Set(
      (await Concert.find({}, { categoryNameMusic: 1 }).lean()).map((item) => item.categoryNameMusic)
    ),
  ].sort();

  const idRange = await Concert.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Concerts seeded: ${inserted}`);
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
    await seedConcerts();
    process.exit(0);
  } catch (error) {
    console.error('Concert seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedConcerts;
