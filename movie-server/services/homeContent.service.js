const HomeContentModel = require('../models/HomeContent.model');
const { notFound } = require('../utils/errors');

const DEFAULT_ID = 'home';

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

/** API/UI expects plain block objects without Mongo subdoc noise. */
const normalizeBlock = (block) => {
  if (!block || typeof block !== 'object') return null;
  const out = { type: String(block.type).trim() };
  if (block.sectionId != null && String(block.sectionId).trim() !== '') {
    out.sectionId = String(block.sectionId).trim();
  }
  if (block.variant != null && String(block.variant).trim() !== '') {
    out.variant = String(block.variant).trim();
  }
  return out.type ? out : null;
};

class HomeContentService {
  async getDocument(id = DEFAULT_ID) {
    const docId = String(id || DEFAULT_ID).trim() || DEFAULT_ID;
    const item = await HomeContentModel.findOne({ id: docId }).lean();
    if (!item) {
      throw notFound(`Home content not found: ${docId}`);
    }
    return stripMongoId(item);
  }

  /** Ordered layout blocks for the home page (same shape as homeContent.json). */
  async getBlocks(id = DEFAULT_ID) {
    const item = await this.getDocument(id);
    const blocks = Array.isArray(item.blocks) ? item.blocks : [];
    return blocks.map(normalizeBlock).filter(Boolean);
  }

  async create(data) {
    const rest = { ...(data || {}) };
    rest.id = String(rest.id || DEFAULT_ID).trim() || DEFAULT_ID;
    rest.blocks = (Array.isArray(rest.blocks) ? rest.blocks : [])
      .map(normalizeBlock)
      .filter(Boolean);

    const item = new HomeContentModel(rest);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new HomeContentService();
