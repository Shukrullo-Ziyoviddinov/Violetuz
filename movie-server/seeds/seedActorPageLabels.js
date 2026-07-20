require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const ActorPageLabel = require('../models/ActorPageLabel.model');
const { ACTOR_PAGE_LABELS_JSON } = require('../config/paths');

const seedActorPageLabels = async () => {
  const raw = fs.readFileSync(ACTOR_PAGE_LABELS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('actorPageLabels.json is empty or invalid');
  }

  await ActorPageLabel.deleteMany({});

  let inserted = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const label = new ActorPageLabel({
      ...item,
      id: String(item.id).trim(),
      sortOrder: index + 1,
    });
    await label.save();
    inserted += 1;
  }

  const ids = (await ActorPageLabel.find({}, { id: 1 }).sort({ sortOrder: 1 }).lean()).map(
    (item) => item.id
  );

  console.log(`Actor page labels seeded: ${inserted}`);
  console.log(`Ids: ${ids.join(', ')}`);

  return { total: inserted, ids };
};

const run = async () => {
  try {
    await connectDB();
    await seedActorPageLabels();
    process.exit(0);
  } catch (error) {
    console.error('Actor page label seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedActorPageLabels;
