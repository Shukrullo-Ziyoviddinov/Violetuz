/**
 * Boshqa kod faqat shu funksiyani chaqiradi.
 * Sozlamani tekshiradi, qo‘ng‘iroqcha yozuvini saqlaydi, qurilmaga shu yerdan uzatadi.
 */

'use strict';

const User = require('../models/User.model');
const { NOTIFICATION_TYPES, TYPE_SETTING_FIELD } = require('./constants');
const { Notification, NotificationSetting } = require('./models');
const { sendToDevices } = require('./device');
const { publishNotification, toLiveItem } = require('./live');

const USER_ID_RE = /^[a-f0-9]{24}$/i;

const isUserId = (value) => USER_ID_RE.test(String(value || '').trim());

const actorSnapshot = (user) => ({
  id: String(user.id || user._id || '').trim(),
  name: String(user.name || '').trim(),
  username: String(user.username || '').trim(),
  avatar: String(user.avatar || '').trim(),
});

const hasSnapshot = (actor) =>
  actor && typeof actor === 'object' && String(actor.name || '').trim().length > 0;

/**
 * @param {string} recipientId kimga
 * @param {string} type qaysi tur
 * @param {string|object} actor kim qildi — id yoki ism/avatar nusxasi
 */
async function sendNotification(recipientId, type, actor) {
  const kind = String(type || '').trim();
  const settingField = TYPE_SETTING_FIELD[kind];
  const recipient = String(recipientId || '').trim();

  if (!NOTIFICATION_TYPES.includes(kind) || !settingField || !isUserId(recipient)) {
    return { sent: false, reason: 'unsupported' };
  }

  const snapshot = await resolveActor(actor);
  if (!snapshot || !isUserId(snapshot.id) || !snapshot.name) {
    return { sent: false, reason: 'actor' };
  }
  if (snapshot.id === recipient) {
    return { sent: false, reason: 'self' };
  }

  const setting = await NotificationSetting.findOne({ userId: recipient })
    .select(settingField)
    .lean();
  const enabled = setting ? setting[settingField] !== false : true;
  if (!enabled) {
    return { sent: false, reason: 'disabled' };
  }

  const notification = await Notification.create({
    userId: recipient,
    type: kind,
    actorId: snapshot.id,
    actor: snapshot,
  });

  try {
    publishNotification(recipient, toLiveItem(notification));
  } catch (_err) {
    // Qo‘ng‘iroqcha yozuvi saqlangan. Ochiq sahifa ulanmasa ham xabar qoladi.
  }

  try {
    await sendToDevices({
      userId: recipient,
      notification,
    });
  } catch (_err) {
    // Qo‘ng‘iroqcha yozuvi saqlangan. Qurilma ulanmasa ham xabar o‘chmaydi.
  }

  return { sent: true, id: String(notification._id) };
}

async function resolveActor(actor) {
  if (hasSnapshot(actor)) return actorSnapshot(actor);
  const actorId = String((actor && (actor.id || actor._id)) || actor || '').trim();
  if (!isUserId(actorId)) return null;
  const user = await User.findById(actorId).select('name username avatar').lean();
  if (!user) return null;
  return actorSnapshot(user);
}

module.exports = {
  sendNotification,
};
