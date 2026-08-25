const { Router } = require('express');
const searchPoiscHistoryController = require('../controllers/searchPoiscHistory.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validateSearchPoiscHistoryListQuery,
  validateSearchPoiscHistoryItemBody,
} = require('../middleware/searchPoiscHistory.validators');

/**
 * Qidiruv click tarixi — faqat login user.
 * Base: /api/search-poisc-history
 *
 * GET    /           — list
 * POST   /items      — click yozish { id, type }
 * DELETE /items      — bitta o‘chirish
 * DELETE /           — barchasini tozalash
 */
const router = Router();

router.use(requireAuth);

router.get(
  '/',
  validateSearchPoiscHistoryListQuery,
  searchPoiscHistoryController.listHistory
);

router.post(
  '/items',
  validateSearchPoiscHistoryItemBody,
  searchPoiscHistoryController.recordClick
);

router.delete(
  '/items',
  validateSearchPoiscHistoryItemBody,
  searchPoiscHistoryController.removeItem
);

router.delete('/', searchPoiscHistoryController.clearHistory);

module.exports = router;
