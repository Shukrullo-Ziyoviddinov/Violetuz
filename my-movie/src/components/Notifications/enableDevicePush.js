import { fetchPushPublicKey, saveNotificationDevice } from '../../api/notificationsApi';

const urlBase64ToUint8Array = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

let pendingSave = null;
let pendingPermission = null;

export const askDevicePermission = () => {
  if (typeof Notification === 'undefined') return Promise.resolve('denied');
  if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
  if (!pendingPermission) {
    pendingPermission = Promise.resolve(Notification.requestPermission()).finally(() => {
      pendingPermission = null;
    });
  }
  return pendingPermission;
};

export const browserHasPushSubscription = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  const subscription = await registration.pushManager.getSubscription();
  return Boolean(subscription);
};

export const ensureDevicePush = () => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return Promise.resolve(false);
  }
  if (!pendingSave) {
    pendingSave = enableDevicePush()
      .then((saved) => {
        if (!saved) pendingSave = null;
        return Boolean(saved);
      })
      .catch((err) => {
        pendingSave = null;
        throw err;
      });
  }
  return pendingSave;
};

export const enableDevicePush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  await navigator.serviceWorker.register('/sw.js');
  const ready = await navigator.serviceWorker.ready;
  const { publicKey } = await fetchPushPublicKey();
  if (!publicKey) return false;
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  const sameKey = (subscription) => {
    const raw = subscription?.options?.applicationServerKey;
    if (!raw) return false;
    const current = new Uint8Array(raw);
    if (current.length !== applicationServerKey.length) return false;
    for (let i = 0; i < current.length; i += 1) {
      if (current[i] !== applicationServerKey[i]) return false;
    }
    return true;
  };
  let subscription = await ready.pushManager.getSubscription();
  if (subscription && !sameKey(subscription)) {
    await subscription.unsubscribe();
    subscription = null;
  }
  if (!subscription) {
    subscription = await ready.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }
  const json = subscription.toJSON();
  if (!json?.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
  await saveNotificationDevice({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
  return true;
};
