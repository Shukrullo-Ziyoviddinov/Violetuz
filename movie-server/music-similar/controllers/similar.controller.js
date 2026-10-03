/**
 * GET /api/music/:id/similar?type=music|klip|album
 * Faqat music_similar_cache. Real-time engine chaqirilmaydi.
 * Auth shart emas (userdan mustaqil).
 *
 * @module music-similar/controllers/similar.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { similarityWeights } = require('../config/similarityWeights');
const {
  toCatalogId,
  normalizeContentType,
} = require('../repositories/catalog.read');
const { listSimilarWithItems } = require('../repositories/similarCache.repository');

const getSimilarMusicItems = asyncHandler(async (req, res) => {
  const sourceId = toCatalogId(req.params.id);
  const contentType = normalizeContentType(req.query.type || 'music');

  if (sourceId == null || !contentType) {
    return sendSuccess(res, {
      data: {
        sourceId: sourceId,
        contentType: contentType,
        items: [],
        total: 0,
      },
    });
  }

  const queryLimit = Number(req.query.limit);
  const limit =
    Number.isFinite(queryLimit) && queryLimit > 0
      ? Math.min(Math.floor(queryLimit), 100)
      : similarityWeights.limit;

  const rows = await listSimilarWithItems(contentType, sourceId, { limit });
  const items = rows
    .filter((row) => row.item)
    .map((row) => ({
      ...row.item,
      similarMeta: {
        position: row.position,
        layer: row.layer,
        score: row.score,
      },
    }));

  return sendSuccess(res, {
    data: {
      sourceId,
      contentType,
      items,
      total: items.length,
    },
  });
});

module.exports = {
  getSimilarMusicItems,
};
