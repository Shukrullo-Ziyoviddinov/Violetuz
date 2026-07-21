require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const MusicPageContent = require('../models/MusicPageContent.model');
const { MUSIC_PAGE_CONTENT_JSON } = require('../config/paths');

const normalizeBlock = (block, sortOrder) => {
  if (!block || typeof block !== 'object' || !block.type) return null;
  const out = {
    sortOrder,
    type: String(block.type).trim(),
  };
  if (block.sectionId != null && String(block.sectionId).trim() !== '') {
    out.sectionId = String(block.sectionId).trim();
  }
  if (block.variant != null && String(block.variant).trim() !== '') {
    out.variant = String(block.variant).trim();
  }
  if (block.source != null && String(block.source).trim() !== '') {
    out.source = String(block.source).trim();
  }
  if (block.typeFilter != null && String(block.typeFilter).trim() !== '') {
    out.typeFilter = String(block.typeFilter).trim();
  }
  return out.type ? out : null;
};

const seedMusicPageContent = async () => {
  const raw = fs.readFileSync(MUSIC_PAGE_CONTENT_JSON, 'utf8');
  const blocks = JSON.parse(raw);

  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error('musicPageContent.json is empty or invalid');
  }

  const normalized = blocks
    .map((block, index) => normalizeBlock(block, index + 1))
    .filter(Boolean);

  if (normalized.length === 0) {
    throw new Error('musicPageContent.json has no valid layout blocks');
  }

  await MusicPageContent.deleteMany({});

  const doc = new MusicPageContent({
    id: 'music',
    blocks: normalized,
  });
  await doc.save();

  console.log(`Music page content seeded: id=${doc.id}`);
  console.log(`Layout blocks: ${normalized.length}`);
  console.log(`sortOrder range: 1 - ${normalized.length}`);
  console.log(`Block types: ${[...new Set(normalized.map((b) => b.type))].join(', ')}`);

  return {
    id: doc.id,
    blockCount: normalized.length,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedMusicPageContent();
    process.exit(0);
  } catch (error) {
    console.error('Music page content seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedMusicPageContent;
