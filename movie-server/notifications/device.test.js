const { test } = require('node:test');
const assert = require('node:assert/strict');

const OWNER = '6a6826b38e66e2b6f64b25ac';

const loadDevice = (setup) => {
  process.env.VAPID_PUBLIC_KEY = 'public-key';
  process.env.VAPID_PRIVATE_KEY = 'private-key';
  process.env.PUBLIC_SITE_URL = 'https://www.violetplay.uz';
  const devicePath = require.resolve('./device');
  const modelPath = require.resolve('./models/NotificationDevice.model');
  const modelsPath = require.resolve('./models');
  const webPushPath = require.resolve('web-push');
  const calls = { sent: [], deleted: [] };

  require.cache[webPushPath] = {
    id: webPushPath,
    filename: webPushPath,
    loaded: true,
    exports: {
      setVapidDetails() {},
      async sendNotification(subscription, payload) {
        calls.sent.push({ subscription, payload });
        if (setup.failStatus && subscription.endpoint.includes('gone')) {
          const err = new Error('gone');
          err.statusCode = setup.failStatus;
          throw err;
        }
      },
    },
  };
  require.cache[modelPath] = {
    id: modelPath,
    filename: modelPath,
    loaded: true,
    exports: {
      find() {
        return {
          select() {
            return { lean: async () => setup.devices || [] };
          },
        };
      },
      async deleteOne(query) {
        calls.deleted.push(query);
      },
    },
  };
  delete require.cache[modelsPath];
  delete require.cache[devicePath];
  return { device: require('./device'), calls };
};

test('qurilma xabari VioletPlay, avatar va obuna matni', async () => {
  const sentCase = loadDevice({
    devices: [{
      endpoint: 'https://push.example/1',
      keys: { p256dh: 'p256', auth: 'auth' },
    }],
  });
  const result = await sentCase.device.sendToDevices({
    userId: OWNER,
    notification: {
      actor: {
        name: 'Malika',
        avatar: 'https://cdn.example/m.jpg',
        email: 'secret@example.com',
      },
      email: 'secret@example.com',
    },
  });
  const message = JSON.parse(sentCase.calls.sent[0].payload);
  assert.equal(result.delivered, 1);
  assert.equal(message.title, 'VioletPlay');
  assert.equal(message.body, 'Malika sizga obuna bo‘ldi');
  assert.equal(message.icon, 'https://cdn.example/m.jpg');
  assert.equal(message.image, 'https://cdn.example/m.jpg');
  assert.equal(message.badge, 'https://www.violetplay.uz/img/newlogo.jpg');
  assert.equal(JSON.stringify(message).includes('secret'), false);

  const logo = loadDevice({}).device.buildDeviceMessage({
    actor: { name: 'Malika', avatar: '' },
  });
  assert.equal(logo.icon, 'https://www.violetplay.uz/img/newlogo.jpg');

  const gone = loadDevice({
    failStatus: 410,
    devices: [{
      endpoint: 'https://push.example/gone',
      keys: { p256dh: 'p256', auth: 'auth' },
    }],
  });
  const removed = await gone.device.sendToDevices({
    userId: OWNER,
    notification: { actor: { name: 'Malika', avatar: 'https://cdn.example/m.jpg' } },
  });
  assert.equal(removed.delivered, 0);
  assert.deepEqual(gone.calls.deleted, [{ endpoint: 'https://push.example/gone' }]);
});
