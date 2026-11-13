const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const { sendSuccess } = require('../utils/response');
const { badRequest } = require('../utils/errors');
const { listNotifications, unreadCount, markNotificationsRead } = require('./read');
const { getSubscriberSetting, saveSubscriberSetting } = require('./settings');
const { attachStream } = require('./live');
const { saveNotificationDevice } = require('./devices');
const { vapidPublicKey } = require('./device');

/**
 * Bildirishnomalar. Base: /api/notifications
 * Foydalanuvchi faqat o‘z xabarlarini ko‘radi.
 */
const router = Router();

router.use(requireAuth);

router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await getSubscriberSetting(req.authUser._id);
  return sendSuccess(res, { data: settings });
}));

router.put('/settings', asyncHandler(async (req, res) => {
  if (typeof req.body?.subscribers !== 'boolean') {
    throw badRequest('subscribers true yoki false bo‘lishi kerak');
  }
  const settings = await saveSubscriberSetting(req.authUser._id, req.body.subscribers);
  return sendSuccess(res, { data: settings });
}));

router.get('/push-key', asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: { publicKey: vapidPublicKey() } });
}));

router.post('/devices', asyncHandler(async (req, res) => {
  const saved = await saveNotificationDevice(req.authUser._id, req.body);
  if (!saved) throw badRequest('Qurilma ma’lumoti to‘liq emas');
  return sendSuccess(res, { data: saved });
}));

router.get('/stream', (req, res) => {
  attachStream(req.authUser._id, req, res);
});

router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await unreadCount(req.authUser._id);
  return sendSuccess(res, { data: { count } });
}));

router.post('/read', asyncHandler(async (req, res) => {
  const updated = await markNotificationsRead(req.authUser._id, req.body?.ids);
  return sendSuccess(res, { data: { updated } });
}));

router.get('/', asyncHandler(async (req, res) => {
  const items = await listNotifications(req.authUser._id, { limit: req.query.limit });
  return sendSuccess(res, { data: { items } });
}));

module.exports = router;
