require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Triller = require('../models/Triller.model');
const { TRILLERS_JSON } = require('../config/paths');

const seedTrillers = async () => {
  const raw = fs.readFileSync(TRILLERS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('triller.json is empty or invalid');
  }

  await Triller.deleteMany({});

  let inserted = 0;

  for (const item of items) {
    const { id: _oldId, ...data } = item;

    const triller = new Triller({
      title: data.title,
      video: data.video,
      videoImg: data.videoImg,
      trillerGenre: data.trillerGenre,
      ageLimit: Number.isFinite(Number(data.ageLimit)) ? Number(data.ageLimit) : 0,
      like: Number.isFinite(Number(data.like)) ? Number(data.like) : 0,
      dislike: Number.isFinite(Number(data.dislike)) ? Number(data.dislike) : 0,
      reytingImdb: Number.isFinite(Number(data.reytingImdb)) ? Number(data.reytingImdb) : 0,
      reytingKinopoisk: Number.isFinite(Number(data.reytingKinopoisk))
        ? Number(data.reytingKinopoisk)
        : 0,
    });

    await triller.save();
    inserted += 1;
  }

  const idRange = await Triller.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Trillers seeded: ${inserted}`);
  console.log(`Auto ID range: ${idRange[0]?.minId} - ${idRange[0]?.maxId}`);

  return {
    total: inserted,
    idRange: idRange[0] || null,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedTrillers();
    process.exit(0);
  } catch (error) {
    console.error('Triller seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedTrillers;
