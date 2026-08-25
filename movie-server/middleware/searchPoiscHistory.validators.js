const { badRequest } = require('../utils/errors');
const {
  SEARCH_POISC_HISTORY_TYPES,
  MAX_HISTORY_PER_USER,
  normalizeType,
} = require('../utils/searchPoiscHistoryTypes');

const ALLOWED = new Set(SEARCH_POISC_HISTORY_TYPES);

/**
 * GET list — ixtiyoriy limit (1…MAX).
 */
const validateSearchPoiscHistoryListQuery = (req, _res, next) => {
  if (req.query.limit != null && req.query.limit !== '') {
    const limit = Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_HISTORY_PER_USER) {
      return next(
        badRequest(`limit 1…${MAX_HISTORY_PER_USER} oralig‘ida butun son bo‘lishi kerak.`)
      );
    }
    req.query.limit = limit;
  }
  next();
};

/**
 * POST click / DELETE item — id + type majburiy.
 * Query matni qabul qilinmaydi (e’tiborsiz qoldiriladi).
 */
const validateSearchPoiscHistoryItemBody = (req, _res, next) => {
  const idRaw = req.body?.id ?? req.query?.id;
  const typeRaw = req.body?.type ?? req.query?.type;

  if (idRaw == null || String(idRaw).trim() === '') {
    return next(badRequest('id majburiy.'));
  }

  if (typeRaw == null || String(typeRaw).trim() === '') {
    return next(badRequest('type majburiy.'));
  }

  const type = normalizeType(typeRaw);
  if (!ALLOWED.has(type)) {
    return next(
      badRequest(`type noto‘g‘ri: ${typeRaw}`, {
        allowedTypes: [...SEARCH_POISC_HISTORY_TYPES],
      })
    );
  }

  const id = String(idRaw).trim();
  req.body = { ...(req.body || {}), id, type };
  next();
};

module.exports = {
  validateSearchPoiscHistoryListQuery,
  validateSearchPoiscHistoryItemBody,
};
