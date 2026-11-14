'use strict';

const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const { sendSuccess } = require('../utils/response');
const { toMessageSelf } = require('./self');
const { listInbox, openThread } = require('./thread');
const { sendChatMessage } = require('./send');
const { attachStream } = require('./live');

/**
 * Xabarlar. Base: /api/messages
 * O‘z kartasi, suhbatni o‘qish va ochiq sahifaga jonli xabar.
 */
const router = Router();

router.use(requireAuth);

router.get('/me', asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: toMessageSelf(req.authUser) });
}));

router.get('/inbox', asyncHandler(async (req, res) => {
  const items = await listInbox(req.authUser._id);
  return sendSuccess(res, { data: { items } });
}));

router.get('/stream', (req, res) => {
  attachStream(req.authUser._id, req, res);
});

router.get('/with/:userId', asyncHandler(async (req, res) => {
  const thread = await openThread(req.authUser._id, req.params.userId);
  return sendSuccess(res, { data: thread });
}));

router.post('/with/:userId', asyncHandler(async (req, res) => {
  const message = await sendChatMessage(req.authUser._id, req.params.userId, req.body?.text);
  return sendSuccess(res, { data: message }, 201);
}));

module.exports = router;
