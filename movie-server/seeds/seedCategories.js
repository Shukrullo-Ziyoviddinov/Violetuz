require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Category = require('../models/Category.model');
const { CATEGORIES_JSON } = require('../config/paths');

const seedCategories = async () => {
  const raw = fs.readFileSync(CATEGORIES_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('categories.json is empty or invalid');
  }

  await Category.deleteMany({});

  let inserted = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const categoryData = {
      ...item,
      id: String(item.id).trim(),
      sortOrder: index + 1,
    };

    const category = new Category(categoryData);
    await category.save();
    inserted += 1;
  }

  const ids = (
    await Category.find({}, { id: 1 }).sort({ sortOrder: 1 }).lean()
  ).map((item) => item.id);

  console.log(`Categories seeded: ${inserted}`);
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
    await seedCategories();
    process.exit(0);
  } catch (error) {
    console.error('Category seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedCategories;
