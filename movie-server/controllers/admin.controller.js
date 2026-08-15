const genreService = require('../services/genre.service');
const bannerService = require('../services/banner.service');
const r2Service = require('../services/r2Service');
const { sendSuccess } = require('../utils/response');
const { badRequest } = require('../utils/errors');
const { assertR2MediaUrl } = require('../utils/assertR2MediaUrl');

const maybeDeleteR2 = async (url) => {
  const key = r2Service.resolveObjectKey(url);
  if (!key) return;
  try {
    await r2Service.deleteObject(key);
  } catch {
    /* ignore orphan cleanup failures */
  }
};

/** GET /admin/me — confirm admin session */
const adminMe = async (req, res) => {
  sendSuccess(res, { data: { user: req.authUser.toPublicJSON() } });
};

/* ─── Genres ─── */

const listGenres = async (_req, res) => {
  const items = await genreService.getAll();
  sendSuccess(res, { count: items.length, data: items });
};

const createGenre = async (req, res) => {
  const body = req.body || {};
  const id = String(body.id || '').trim();
  if (!id) throw badRequest('id majburiy');
  if (!body.title || typeof body.title !== 'object') {
    throw badRequest('title { uz, ru } majburiy');
  }
  if (body.filterGenre === undefined) {
    throw badRequest('filterGenre majburiy');
  }

  const img = assertR2MediaUrl(body.img ?? '', { field: 'img' });
  const item = await genreService.create({
    id,
    title: body.title,
    img: img || '',
    filterGenre: body.filterGenre,
    sortOrder: body.sortOrder != null ? Number(body.sortOrder) : 0,
  });

  sendSuccess(res, { data: item }, 201);
};

const updateGenre = async (req, res) => {
  const body = req.body || {};
  const patch = {};

  if (body.title !== undefined) patch.title = body.title;
  if (body.filterGenre !== undefined) patch.filterGenre = body.filterGenre;
  if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder) || 0;
  if (body.img !== undefined) {
    patch.img = assertR2MediaUrl(body.img, { field: 'img' });
  }

  const existing = await genreService.getById(req.params.id);
  const item = await genreService.update(req.params.id, patch);

  if (
    body.img !== undefined &&
    existing.img &&
    existing.img !== item.img &&
    String(existing.img).startsWith('http')
  ) {
    await maybeDeleteR2(existing.img);
  }

  sendSuccess(res, { data: item });
};

const deleteGenre = async (req, res) => {
  const item = await genreService.remove(req.params.id);
  if (item.img && String(item.img).startsWith('http')) {
    await maybeDeleteR2(item.img);
  }
  sendSuccess(res, { data: item });
};

/* ─── Banners ─── */

const listBanners = async (req, res) => {
  const items = await bannerService.getAll({
    lang: req.query.lang,
    movieId: req.query.movieId,
  });
  sendSuccess(res, { count: items.length, data: items });
};

const createBanner = async (req, res) => {
  const body = req.body || {};
  const lang = String(body.lang || '').trim();
  const movieId = Number(body.movieId);

  if (lang !== 'uz' && lang !== 'ru') {
    throw badRequest('lang uz|ru bo‘lishi kerak');
  }
  if (!Number.isInteger(movieId) || movieId <= 0) {
    throw badRequest('movieId majburiy');
  }

  const image = assertR2MediaUrl(body.image ?? '', { field: 'image' });
  const video = assertR2MediaUrl(body.video ?? '', { field: 'video' });

  const item = await bannerService.create({
    lang,
    movieId,
    image: image || '',
    video: video || '',
  });

  sendSuccess(res, { data: item }, 201);
};

const updateBanner = async (req, res) => {
  const body = req.body || {};
  const patch = {};

  if (body.lang !== undefined) patch.lang = body.lang;
  if (body.movieId !== undefined) patch.movieId = Number(body.movieId);
  if (body.image !== undefined) {
    patch.image = assertR2MediaUrl(body.image, { field: 'image' });
  }
  if (body.video !== undefined) {
    patch.video = assertR2MediaUrl(body.video, { field: 'video' });
  }

  const existing = await bannerService.getById(req.params.id);
  const item = await bannerService.update(req.params.id, patch);

  if (body.image !== undefined && existing.image && existing.image !== item.image) {
    if (String(existing.image).startsWith('http')) await maybeDeleteR2(existing.image);
  }
  if (body.video !== undefined && existing.video && existing.video !== item.video) {
    if (String(existing.video).startsWith('http')) await maybeDeleteR2(existing.video);
  }

  sendSuccess(res, { data: item });
};

const deleteBanner = async (req, res) => {
  const item = await bannerService.remove(req.params.id);
  if (item.image && String(item.image).startsWith('http')) await maybeDeleteR2(item.image);
  if (item.video && String(item.video).startsWith('http')) await maybeDeleteR2(item.video);
  sendSuccess(res, { data: item });
};

module.exports = {
  adminMe,
  listGenres,
  createGenre,
  updateGenre,
  deleteGenre,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
