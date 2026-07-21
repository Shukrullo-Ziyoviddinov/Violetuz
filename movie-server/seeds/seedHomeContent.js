require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const HomeContent = require('../models/HomeContent.model');
const { HOME_CONTENT_JSON } = require('../config/paths');

const normalizeBlock = (block) => {
  if (!block || typeof block !== 'object' || !block.type) return null;
  const out = { type: String(block.type).trim() };
  if (block.sectionId != null && String(block.sectionId).trim() !== '') {
    out.sectionId = String(block.sectionId).trim();
  }
  if (block.variant != null && String(block.variant).trim() !== '') {
    out.variant = String(block.variant).trim();
  }
  return out.type ? out : null;
};

const seedHomeContent = async () => {
  const raw = fs.readFileSync(HOME_CONTENT_JSON, 'utf8');
  const blocks = JSON.parse(raw);

  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error('homeContent.json is empty or invalid');
  }

  const normalized = blocks.map(normalizeBlock).filter(Boolean);
  if (normalized.length === 0) {
    throw new Error('homeContent.json has no valid layout blocks');
  }

  await HomeContent.deleteMany({});

  const doc = new HomeContent({
    id: 'home',
    blocks: normalized,
  });
  await doc.save();

  console.log(`Home content seeded: id=${doc.id}`);
  console.log(`Layout blocks: ${normalized.length}`);
  console.log(`Block types: ${[...new Set(normalized.map((b) => b.type))].join(', ')}`);

  return {
    id: doc.id,
    blockCount: normalized.length,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedHomeContent();
    process.exit(0);
  } catch (error) {
    console.error('Home content seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedHomeContent;
