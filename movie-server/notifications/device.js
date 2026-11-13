/**
 * Qurilmaga yuborish.
 * sendNotification shu funksiyani chaqiradi.
 * Sarlavha VioletPlay, avatar va «sizga obuna bo‘ldi».
 */

'use strict';

const webpush = require('web-push');
const { NotificationDevice } = require('./models');

const SITE_NAME = 'VioletPlay';

const vapidPublicKey = () => String(process.env.VAPID_PUBLIC_KEY || '').trim();

const siteOrigin = () =>
  String(process.env.PUBLIC_SITE_URL || process.env.CLIENT_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/+$/, '');

let configuredKey = '';

const ensureVapid = () => {
  const publicKey = vapidPublicKey();
  const privateKey = String(process.env.VAPID_PRIVATE_KEY || '').trim();
  if (!publicKey || !privateKey) return false;
  if (configuredKey !== publicKey) {
    const subject = String(process.env.VAPID_SUBJECT || 'mailto:support@violetplay.uz').trim();
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configuredKey = publicKey;
  }
  return true;
};

const buildDeviceMessage = (notification) => {
  const name = String(notification?.actor?.name || notification?.actor?.username || '').trim();
  const avatar = String(notification?.actor?.avatar || '').trim();
  const icon = /^https?:\/\//i.test(avatar) ? avatar : `${siteOrigin()}/img/newlogo.jpg`;
  return {
    title: SITE_NAME,
    body: name ? `${name} sizga obuna bo‘ldi` : 'sizga obuna bo‘ldi',
    icon,
  };
};

async function sendToDevices({ userId, notification } = {}) {
  if (!ensureVapid() || !userId) return { connected: false, delivered: 0 };
  const devices = await NotificationDevice.find({ userId }).select('endpoint keys').lean();
  if (!devices.length) return { connected: true, delivered: 0 };

  const payload = JSON.stringify(buildDeviceMessage(notification));
  let delivered = 0;
  await Promise.all(devices.map(async (device) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: device.endpoint,
          keys: {
            p256dh: device.keys?.p256dh,
            auth: device.keys?.auth,
          },
        },
        payload
      );
      delivered += 1;
    } catch (err) {
      const status = err?.statusCode;
      if (status === 404 || status === 410) {
        await NotificationDevice.deleteOne({ endpoint: device.endpoint });
      } else {
        console.error('device-push failed', status || err?.message || 'unknown');
      }
    }
  }));
  return { connected: true, delivered };
}

module.exports = {
  sendToDevices,
  buildDeviceMessage,
  vapidPublicKey,
};
