const { test } = require('node:test');
const assert = require('node:assert/strict');

const OWNER = '6a6826b38e66e2b6f64b25ac';

const load = () => {
  const modelPath = require.resolve('./models/NotificationDevice.model');
  const modelsPath = require.resolve('./models');
  const devicesPath = require.resolve('./devices');
  const calls = {};
  require.cache[modelPath] = {
    id: modelPath,
    filename: modelPath,
    loaded: true,
    exports: {
      async findOneAndUpdate(query, update) {
        calls.save = { query, update };
        return { endpoint: query.endpoint };
      },
    },
  };
  delete require.cache[modelsPath];
  delete require.cache[devicesPath];
  return { devices: require('./devices'), calls };
};

test('ruxsat berilgan qurilma faqat manzil va kalit bilan saqlanadi', async () => {
  const { devices, calls } = load();
  const result = await devices.saveNotificationDevice(OWNER, {
    endpoint: 'https://push.example/device',
    keys: { p256dh: 'p256', auth: 'authkey' },
    email: 'secret@example.com',
    password: 'secret',
  });
  const packed = JSON.stringify(calls.save);
  assert.deepEqual(result, { saved: true });
  assert.deepEqual(calls.save.update, {
    $set: {
      userId: OWNER,
      endpoint: 'https://push.example/device',
      keys: { p256dh: 'p256', auth: 'authkey' },
    },
  });
  assert.equal(packed.includes('secret'), false);
  assert.equal(packed.includes('email'), false);
});
