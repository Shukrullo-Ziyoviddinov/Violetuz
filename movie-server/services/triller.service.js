const TrillerModel = require('../models/Triller.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

const normalizeLocalized = (value, fieldName) => {
  if (value == null) {
    throw badRequest(`${fieldName} is required`);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      throw badRequest(`${fieldName} must be a non-empty string`);
    }
    return { uz: trimmed, ru: trimmed };
  }

  if (typeof value !== 'object') {
    throw badRequest(`${fieldName} must be a string or { uz, ru } object`);
  }

  const uz = value.uz != null ? String(value.uz).trim() : '';
  const ru = value.ru != null ? String(value.ru).trim() : '';

  if (!uz && !ru) {
    throw badRequest(`${fieldName} must include uz or ru`);
  }

  return { uz, ru };
};

const normalizeCount = (value, fieldName, fallback = 0) => {
  if (value == null || value === '') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || !Number.isInteger(num)) {
    throw badRequest(`${fieldName} must be a non-negative integer`);
  }
  return num;
};

const normalizeRating = (value, fieldName, fallback = 0) => {
  if (value == null || value === '') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw badRequest(`${fieldName} must be a non-negative number`);
  }
  return Math.round(num * 10) / 10;
};

class TrillerService {
  async getAll() {
    const items = await TrillerModel.find({}).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid triller id: ${id}`);
    }

    const item = await TrillerModel.findOne({ id: numericId }).lean();
    if (!item) {
      throw notFound(`Triller not found: ${id}`);
    }

    return stripMongoId(item);
  }

  async create(data) {
    const { id: _oldId, ...raw } = data || {};

    const payload = {
      title: normalizeLocalized(raw.title, 'title'),
      video: normalizeLocalized(raw.video, 'video'),
      videoImg: normalizeLocalized(raw.videoImg, 'videoImg'),
      trillerGenre: normalizeLocalized(raw.trillerGenre, 'trillerGenre'),
      ageLimit: normalizeCount(raw.ageLimit, 'ageLimit', 0),
      like: normalizeCount(raw.like, 'like', 0),
      dislike: normalizeCount(raw.dislike, 'dislike', 0),
      reytingImdb: normalizeRating(raw.reytingImdb, 'reytingImdb', 0),
      reytingKinopoisk: normalizeRating(raw.reytingKinopoisk, 'reytingKinopoisk', 0),
    };

    const item = new TrillerModel(payload);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new TrillerService();
