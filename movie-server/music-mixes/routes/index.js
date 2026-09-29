/**
 * GET  /api/music/mixes                    cookie user, tayyor mix
 * POST /api/music/mixes/play               cookie user, javob darhol
 * POST /api/music/mixes/share              cookie user, snapshot token
 * GET  /api/music/mixes/share/:token       public JSON
 * GET  /api/music/mixes/share/:token/card  public OG HTML
 *
 * @module music-mixes/routes
 */

'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { postMixPlay } = require('../controllers/play.controller');
const { getMixes } = require('../controllers/mix.controller');
const {
  postMixShare,
  getMixShare,
  getMixShareCard,
} = require('../controllers/share.controller');

const router = Router();

router.get('/', requireAuth, getMixes);
router.post('/play', requireAuth, postMixPlay);
router.post('/share', requireAuth, postMixShare);
router.get('/share/:token/card', getMixShareCard);
router.get('/share/:token', getMixShare);

module.exports = router;
