const SiteLinksModel = require('../models/SiteLinks.model');
const { badRequest, notFound } = require('../utils/errors');

const DEFAULT_ID = 'site';

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

const emptyPayload = () => ({
  id: DEFAULT_ID,
  contact: {},
  socialLinks: {},
  appStoreLinks: {},
});

class SiteLinksService {
  async getSiteLinks(id = DEFAULT_ID) {
    const docId = String(id || DEFAULT_ID).trim() || DEFAULT_ID;
    const item = await SiteLinksModel.findOne({ id: docId }).lean();
    if (!item) {
      throw notFound(`Site links not found: ${docId}`);
    }
    return stripMongoId(item);
  }

  async getContact(id = DEFAULT_ID) {
    const item = await this.getSiteLinks(id);
    return item.contact || {};
  }

  async getSocialLinks(id = DEFAULT_ID) {
    const item = await this.getSiteLinks(id);
    return item.socialLinks || {};
  }

  async getAppStoreLinks(id = DEFAULT_ID) {
    const item = await this.getSiteLinks(id);
    return item.appStoreLinks || {};
  }

  async create(data) {
    const rest = { ...(data || {}) };
    rest.id = String(rest.id || DEFAULT_ID).trim() || DEFAULT_ID;

    if (!rest.contact || typeof rest.contact !== 'object') {
      throw badRequest('contact object is required');
    }
    if (!rest.socialLinks || typeof rest.socialLinks !== 'object') {
      throw badRequest('socialLinks object is required');
    }
    if (!rest.appStoreLinks || typeof rest.appStoreLinks !== 'object') {
      throw badRequest('appStoreLinks object is required');
    }

    const item = new SiteLinksModel(rest);
    await item.save();
    return stripMongoId(item);
  }

  emptyPayload() {
    return emptyPayload();
  }
}

module.exports = new SiteLinksService();
