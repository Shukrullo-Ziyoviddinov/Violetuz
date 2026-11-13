/**
 * Qo‘ng‘iroqcha o‘qish yo‘llari.
 * Har doim so‘ralgan foydalanuvchining o‘z xabarlari.
 */

'use strict';

const { Notification } = require('./models');

const USER_ID_RE = /^[a-f0-9]{24}$/i;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;
const MAX_IDS = 50;

const isUserId = (value) => USER_ID_RE.test(String(value || '').trim());

const parseLimit = (value) => {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
};

const ownIds = (ids) => {
  if (!Array.isArray(ids)) return [];
  const unique = [];
  const seen = new Set();
  for (const raw of ids) {
    const id = String(raw || '').trim();
    if (!isUserId(id) || seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
    if (unique.length >= MAX_IDS) break;
  }
  return unique;
};

const toClientItem = (row) => ({
  id: String(row._id),
  type: row.type,
  actor: {
    id: String(row.actor?.id || ''),
    name: String(row.actor?.name || ''),
    username: String(row.actor?.username || ''),
    avatar: String(row.actor?.avatar || ''),
  },
  readAt: row.readAt || null,
  createdAt: row.createdAt,
});

async function listNotifications(userId, { limit } = {}) {
  const ownerId = String(userId || '').trim();
  if (!isUserId(ownerId)) return [];
  const rows = await Notification.find({ userId: ownerId })
    .sort({ createdAt: -1 })
    .limit(parseLimit(limit))
    .select('type actor readAt createdAt')
    .lean();
  return rows.map(toClientItem);
}

async function unreadCount(userId) {
  const ownerId = String(userId || '').trim();
  if (!isUserId(ownerId)) return 0;
  return Notification.countDocuments({ userId: ownerId, readAt: null });
}

async function markNotificationsRead(userId, ids) {
  const ownerId = String(userId || '').trim();
  const notificationIds = ownIds(ids);
  if (!isUserId(ownerId) || !notificationIds.length) return 0;
  const result = await Notification.updateMany(
    { userId: ownerId, _id: { $in: notificationIds }, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return result.modifiedCount || 0;
}

module.exports = {
  listNotifications,
  unreadCount,
  markNotificationsRead,
};
