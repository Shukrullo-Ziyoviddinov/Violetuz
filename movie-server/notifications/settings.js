/**
 * «Yangi obunachilar» sozlamasi.
 * Yoqilgan bo‘lsa xabar ketadi, o‘chiq bo‘lsa ketmaydi.
 */

'use strict';

const { NotificationSetting } = require('./models');

const USER_ID_RE = /^[a-f0-9]{24}$/i;

const isUserId = (value) => USER_ID_RE.test(String(value || '').trim());

const toClient = (row) => ({
  subscribers: row ? row.subscribers !== false : true,
});

async function getSubscriberSetting(userId) {
  const ownerId = String(userId || '').trim();
  if (!isUserId(ownerId)) return toClient(null);
  const row = await NotificationSetting.findOne({ userId: ownerId })
    .select('subscribers')
    .lean();
  return toClient(row);
}

async function saveSubscriberSetting(userId, subscribers) {
  const ownerId = String(userId || '').trim();
  if (!isUserId(ownerId) || typeof subscribers !== 'boolean') return null;
  const row = await NotificationSetting.findOneAndUpdate(
    { userId: ownerId },
    { $set: { subscribers } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .select('subscribers')
    .lean();
  return toClient(row);
}

module.exports = {
  getSubscriberSetting,
  saveSubscriberSetting,
};
