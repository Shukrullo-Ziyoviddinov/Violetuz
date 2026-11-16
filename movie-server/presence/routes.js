'use strict';

const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const { sendSuccess } = require('../utils/response');
const { badRequest } = require('../utils/errors');
const {
  isPresenceId,
  isOnline,
  watchPresence,
  unwatchPresence,
  attachPresenceStream,
} = require('./live');

/**
 * Sayt bo'ylab onlayn holat. Base: /api/presence
 */
const router = Router();

router.use(requireAuth);

router.get('/stream', (req, res) => {
  attachPresenceStream(req.authUser._id, req, res);
});

router.get('/:userId', asyncHandler(async (req, res) => {
  const target = String(req.params.userId || '').trim().toLowerCase();
  if (!isPresenceId(target)) throw badRequest('Foydalanuvchi topilmadi');
  const online = watchPresence(req.authUser._id, target);
  return sendSuccess(res, { data: { userId: target, online } });
}));

router.delete('/:userId', asyncHandler(async (req, res) => {
  const target = String(req.params.userId || '').trim().toLowerCase();
  if (!isPresenceId(target)) throw badRequest('Foydalanuvchi topilmadi');
  unwatchPresence(req.authUser._id, target);
  return sendSuccess(res, { data: { userId: target, online: false } });
}));

module.exports = router;
