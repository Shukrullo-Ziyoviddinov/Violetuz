/**
 * GET  /api/music/mixes      cookie user, tayyor mix
 * POST /api/music/mixes/play cookie user, javob darhol
 *
 * @module music-mixes/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { postMixPlay } = require('../controllers/play.controller');
const { getMixes } = require('../controllers/mix.controller');

const router = Router();

router.get('/', requireAuth, getMixes);
router.post('/play', requireAuth, postMixPlay);

module.exports = router;
