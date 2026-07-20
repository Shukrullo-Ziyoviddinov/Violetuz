require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Actor = require('../models/Actor.model');
const { ACTORS_JSON } = require('../config/paths');

const seedActors = async () => {
  const raw = fs.readFileSync(ACTORS_JSON, 'utf8');
  const actors = JSON.parse(raw);

  if (!Array.isArray(actors) || actors.length === 0) {
    throw new Error('actors.json is empty or invalid');
  }

  await Actor.deleteMany({});

  let inserted = 0;

  for (const item of actors) {
    const { id: _oldId, ...actorData } = item;
    if (actorData.actorsGenre) {
      actorData.actorsGenre = String(actorData.actorsGenre).trim();
    }

    const actor = new Actor(actorData);
    await actor.save();
    inserted += 1;
  }

  const genres = [
    ...new Set(
      (await Actor.find({}, { actorsGenre: 1 }).lean()).map((item) => item.actorsGenre)
    ),
  ].sort();

  const idRange = await Actor.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Actors seeded: ${inserted}`);
  console.log(`Auto ID range: ${idRange[0]?.minId} - ${idRange[0]?.maxId}`);
  console.log(`Genres: ${genres.join(', ')}`);

  return {
    total: inserted,
    genres,
    idRange: idRange[0] || null,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedActors();
    process.exit(0);
  } catch (error) {
    console.error('Actor seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedActors;
