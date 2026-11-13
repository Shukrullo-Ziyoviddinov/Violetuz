const { test } = require('node:test');
const assert = require('node:assert/strict');

const OWNER = '6a6826b38e66e2b6f64b25ac';

const load = (setup) => {
  const modelPath = require.resolve('./models/NotificationSetting.model');
  const modelsPath = require.resolve('./models');
  const settingsPath = require.resolve('./settings');
  const calls = {};

  require.cache[modelPath] = {
    id: modelPath,
    filename: modelPath,
    loaded: true,
    exports: {
      findOne(query) {
        calls.getQuery = query;
        return {
          select(fields) {
            calls.getFields = fields;
            return { lean: async () => setup.row };
          },
        };
      },
      findOneAndUpdate(query, update) {
        calls.save = { query, update };
        return {
          select() {
            return {
              lean: async () => ({
                subscribers: update.$set.subscribers,
                email: 'secret@example.com',
                passwordHash: 'secret',
              }),
            };
          },
        };
      },
    },
  };
  delete require.cache[modelsPath];
  delete require.cache[settingsPath];
  return { settings: require('./settings'), calls };
};

test('sozlama yo‘q bo‘lsa Yangi obunachilar yoqilgan hisoblanadi', async () => {
  const { settings, calls } = load({ row: null });
  const result = await settings.getSubscriberSetting(OWNER);
  assert.deepEqual(result, { subscribers: true });
  assert.deepEqual(calls.getQuery, { userId: OWNER });
  assert.equal(calls.getFields, 'subscribers');
});

test('o‘chiq sozlama o‘chiq qaytadi va ortiqcha maydon chiqmaydi', async () => {
  const { settings } = load({
    row: { subscribers: false, email: 'secret@example.com', passwordHash: 'secret' },
  });
  const result = await settings.getSubscriberSetting(OWNER);
  const packed = JSON.stringify(result);
  assert.deepEqual(result, { subscribers: false });
  assert.equal(packed.includes('email'), false);
  assert.equal(packed.includes('secret'), false);
});

test('o‘chirish faqat subscribers maydonini yozadi', async () => {
  const { settings, calls } = load({});
  const result = await settings.saveSubscriberSetting(OWNER, false);
  assert.deepEqual(result, { subscribers: false });
  assert.deepEqual(calls.save.query, { userId: OWNER });
  assert.deepEqual(calls.save.update, { $set: { subscribers: false } });
});

test('yoqish xabar ketishi uchun true saqlaydi', async () => {
  const { settings, calls } = load({});
  const result = await settings.saveSubscriberSetting(OWNER, true);
  assert.deepEqual(result, { subscribers: true });
  assert.deepEqual(calls.save.update, { $set: { subscribers: true } });
});
