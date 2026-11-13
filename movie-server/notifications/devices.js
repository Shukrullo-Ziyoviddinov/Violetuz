/**
 * Ruxsat berilgan qurilmani saqlash.
 * Faqat push manzili va kalitlari. Parol va email yozilmaydi.
 */

'use strict';

const { NotificationDevice } = require('./models');

const USER_ID_RE = /^[a-f0-9]{24}$/i;

const saveNotificationDevice = async (userId, body) => {
  const ownerId = String(userId || '').trim();
  const endpoint = String(body?.endpoint || '').trim();
  const p256dh = String(body?.keys?.p256dh || '').trim();
  const auth = String(body?.keys?.auth || '').trim();
  if (!USER_ID_RE.test(ownerId)) return null;
  if (!endpoint.startsWith('https://') || endpoint.length > 2000) return null;
  if (!p256dh || !auth || p256dh.length > 300 || auth.length > 300) return null;

  await NotificationDevice.findOneAndUpdate(
    { endpoint },
    { $set: { userId: ownerId, endpoint, keys: { p256dh, auth } } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { saved: true };
};

module.exports = {
  saveNotificationDevice,
};
