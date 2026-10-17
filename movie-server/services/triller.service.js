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

const normalizeDescriptionLang = (value) => {
  if (!value || typeof value !== 'object') {
    return { text: '', year: '', country: '', genre: '' };
  }
  return {
    text: value.text != null ? String(value.text).trim() : '',
    year: value.year != null ? String(value.year).trim() : '',
    country: value.country != null ? String(value.country).trim() : '',
    genre: value.genre != null ? String(value.genre).trim() : '',
  };
};

const normalizeStringList = (value) => {
  if (value == null || value === '') return [];
  const source = Array.isArray(value) ? value : [value];
  const seen = new Set();
  const list = [];
  for (const item of source) {
    const token = item != null ? String(item).trim() : '';
    if (!token || seen.has(token)) continue;
    seen.add(token);
    list.push(token);
  }
  return list;
};

const normalizeActorIds = (value) => {
  if (value == null || value === '') return [];
  const source = Array.isArray(value) ? value : [value];
  const seen = new Set();
  const list = [];
  for (const item of source) {
    if (typeof item === 'number' && Number.isInteger(item) && item > 0) {
      const key = `n:${item}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(item);
      continue;
    }
    const token = item != null ? String(item).trim() : '';
    if (!token || seen.has(token)) continue;
    const asNumber = Number(token);
    if (Number.isInteger(asNumber) && String(asNumber) === token && asNumber > 0) {
      const key = `n:${asNumber}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(asNumber);
      continue;
    }
    seen.add(token);
    list.push(token);
  }
  return list;
};

const normalizeOptionalPositiveInt = (value) => {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
};

const normalizeDescription = (value) => {
  if (!value || typeof value !== 'object') {
    return {
      uz: normalizeDescriptionLang(null),
      ru: normalizeDescriptionLang(null),
    };
  }
  return {
    uz: normalizeDescriptionLang(value.uz),
    ru: normalizeDescriptionLang(value.ru),
  };
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
      filterGenre: normalizeStringList(raw.filterGenre),
      filterCountry: normalizeStringList(raw.filterCountry),
      actors: normalizeActorIds(raw.actors),
      franchiseMovieId: normalizeOptionalPositiveInt(raw.franchiseMovieId),
      franchiseOrder: normalizeOptionalPositiveInt(raw.franchiseOrder),
      ageLimit: normalizeCount(raw.ageLimit, 'ageLimit', 0),
      like: normalizeCount(raw.like, 'like', 0),
      dislike: normalizeCount(raw.dislike, 'dislike', 0),
      reytingImdb: normalizeRating(raw.reytingImdb, 'reytingImdb', 0),
      reytingKinopoisk: normalizeRating(raw.reytingKinopoisk, 'reytingKinopoisk', 0),
      description: normalizeDescription(raw.description),
    };

    const item = new TrillerModel(payload);
    await item.save();
    return stripMongoId(item);
  }
}

module.exports = new TrillerService();
