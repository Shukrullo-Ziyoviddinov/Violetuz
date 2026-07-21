const MusicPageContentModel = require('../models/MusicPageContent.model');
const { notFound } = require('../utils/errors');

const DEFAULT_ID = 'music';

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

/** Keep layout fields + sortOrder for admin reorder. */
const normalizeBlock = (block, fallbackOrder = 0) => {
  if (!block || typeof block !== 'object') return null;
  const type = String(block.type || '').trim();
  if (!type) return null;

  const out = {
    sortOrder: Number.isFinite(Number(block.sortOrder))
      ? Number(block.sortOrder)
      : fallbackOrder,
    type,
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

  return out;
};

class MusicPageContentService {
  async getDocument(id = DEFAULT_ID) {
    const docId = String(id || DEFAULT_ID).trim() || DEFAULT_ID;
    const item = await MusicPageContentModel.findOne({ id: docId }).lean();
    if (!item) {
      throw notFound(`Music page content not found: ${docId}`);
    }
    return stripMongoId(item);
  }

  /** Ordered layout blocks for the music page (sorted by sortOrder). */
  async getBlocks(id = DEFAULT_ID) {
    const item = await this.getDocument(id);
    const blocks = Array.isArray(item.blocks) ? item.blocks : [];
    return blocks
      .map((block, index) => normalizeBlock(block, index + 1))
      .filter(Boolean)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    rest.id = String(rest.id || DEFAULT_ID).trim() || DEFAULT_ID;
    rest.blocks = (Array.isArray(rest.blocks) ? rest.blocks : [])
      .map((block, index) => normalizeBlock(block, index + 1))
      .filter(Boolean)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const item = new MusicPageContentModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new MusicPageContentService();
