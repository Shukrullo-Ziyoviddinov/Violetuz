/**
 * Parda ortida video foizi.
 *
 * GET  /api/triller-progress   hisobdagi foydalanuvchining foizlari
 * POST /api/triller-progress   hisobga yozish
 *
 * Mehmon uchun yo‘l yo‘q. Kino /recommendations/progress chaqirilmaydi.
 *
 * @module recommendation-triller/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const controller = require('../controllers');

const router = Router();

router.use(requireAuth);
router.get('/', controller.getProgress);
router.post('/', controller.postProgress);

module.exports = router;
