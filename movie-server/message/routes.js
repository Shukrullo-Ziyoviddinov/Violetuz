'use strict';

const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const { sendSuccess } = require('../utils/response');
const { toMessageSelf } = require('./self');
const { listInbox, openThread, isUserId, loadPeer } = require('./thread');
const { sendChatMessage } = require('./send');
const { removeChatMessage } = require('./remove');
const { editChatMessage } = require('./edit');
const { attachStream, publishTyping } = require('./live');
const { badRequest } = require('../utils/errors');
const { listBackgrounds, getMyBackground, saveMyBackground } = require('./background');

/**
 * Xabarlar. Base: /api/messages
 * O‘z kartasi, suhbatni o‘qish va ochiq sahifaga jonli xabar.
 */
const router = Router();

router.use(requireAuth);

router.get('/me', asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: toMessageSelf(req.authUser) });
}));

router.get('/backgrounds', asyncHandler(async (req, res) => {
  const items = await listBackgrounds();
  return sendSuccess(res, { data: { items } });
}));

router.get('/background', asyncHandler(async (req, res) => {
  const choice = await getMyBackground(req.authUser._id);
  return sendSuccess(res, { data: choice });
}));

router.put('/background', asyncHandler(async (req, res) => {
  const choice = await saveMyBackground(req.authUser._id, req.body?.backgroundId);
  return sendSuccess(res, { data: choice });
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

router.post('/with/:userId/typing', asyncHandler(async (req, res) => {
  const me = String(req.authUser._id || '').trim().toLowerCase();
  const peer = String(req.params.userId || '').trim().toLowerCase();
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (!isUserId(peer) || me === peer) throw badRequest('Suhbat topilmadi');
  await loadPeer(peer);
  const typing = req.body?.typing === true;
  publishTyping(peer, { userId: me, typing });
  return sendSuccess(res, { data: { typing } });
}));

router.post('/:messageId/edit', asyncHandler(async (req, res) => {
  const result = await editChatMessage(
    req.authUser._id,
    req.params.messageId,
    req.body?.text,
    req.body?.quoteText
  );
  return sendSuccess(res, { data: result });
}));

router.post('/:messageId/hide', asyncHandler(async (req, res) => {
  const result = await removeChatMessage(
    req.authUser._id,
    req.params.messageId,
    req.body?.forPeer === true
  );
  return sendSuccess(res, { data: result });
}));

router.post('/with/:userId', asyncHandler(async (req, res) => {
  const message = await sendChatMessage(
    req.authUser._id,
    req.params.userId,
    req.body?.text,
    req.body?.replyTo,
    req.body?.animated === true,
    req.body?.animationId,
    req.body?.gif
  );
  return sendSuccess(res, { data: message }, 201);
}));

module.exports = router;
