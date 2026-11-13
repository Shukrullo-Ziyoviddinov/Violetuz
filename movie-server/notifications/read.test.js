const { test } = require('node:test');
const assert = require('node:assert/strict');

const OWNER = '6a6826b38e66e2b6f64b25ac';
const OTHER = '6a80677eaa8558e009607e22';
const NOTICE = '6a80677eaa8558e009607e23';

const load = (setup) => {
  const modelPath = require.resolve('./models/Notification.model');
  const modelsPath = require.resolve('./models');
  const readPath = require.resolve('./read');
  const calls = {};

  require.cache[modelPath] = {
    id: modelPath,
    filename: modelPath,
    loaded: true,
    exports: {
      find(query) {
        calls.listQuery = query;
        const chain = {
          sort() { return chain; },
          limit(limit) {
            calls.limit = limit;
            return chain;
          },
          select(fields) {
            calls.fields = fields;
            return chain;
          },
          lean: async () => setup.rows || [],
        };
        return chain;
      },
      countDocuments(query) {
        calls.countQuery = query;
        return 2;
      },
      updateMany(filter, update) {
        calls.update = { filter, update };
        return { modifiedCount: filter._id.$in.length };
      },
    },
  };
  delete require.cache[modelsPath];
  delete require.cache[readPath];
  return { read: require('./read'), calls };
};

test('ro‘yxat faqat o‘z xabari va parol yoki email chiqmaydi', async () => {
  const { read, calls } = load({
    rows: [{
      _id: NOTICE,
      userId: OWNER,
      type: 'subscriber',
      email: 'owner@example.com',
      passwordHash: 'secret',
      actor: {
        id: OTHER,
        name: 'Malika',
        username: 'malika',
        avatar: 'https://cdn.example/m.jpg',
        email: 'malika@example.com',
        passwordHash: 'secret',
      },
      readAt: null,
      createdAt: new Date('2026-11-13T12:00:00.000Z'),
    }],
  });

  const items = await read.listNotifications(OWNER, { limit: 10 });
  const packed = JSON.stringify(items);

  assert.deepEqual(calls.listQuery, { userId: OWNER });
  assert.equal(calls.limit, 10);
  assert.equal(items.length, 1);
  assert.deepEqual(items[0].actor, {
    id: OTHER,
    name: 'Malika',
    username: 'malika',
    avatar: 'https://cdn.example/m.jpg',
  });
  assert.equal(packed.includes('email'), false);
  assert.equal(packed.includes('password'), false);
  assert.equal(packed.includes('secret'), false);
});

test('o‘qilmagan son faqat o‘zining ochiq xabarlari', async () => {
  const { read, calls } = load({});
  const count = await read.unreadCount(OWNER);
  assert.equal(count, 2);
  assert.deepEqual(calls.countQuery, { userId: OWNER, readAt: null });
});

test('o‘qildi belgisi faqat o‘zining berilgan xabarlariga', async () => {
  const { read, calls } = load({});
  const updated = await read.markNotificationsRead(OWNER, [NOTICE, NOTICE, 'nope', OTHER]);

  assert.equal(updated, 2);
  assert.equal(calls.update.filter.userId, OWNER);
  assert.deepEqual(calls.update.filter._id.$in, [NOTICE, OTHER]);
  assert.equal(calls.update.filter.readAt, null);
  assert.ok(calls.update.update.$set.readAt instanceof Date);
});

test('bo‘sh ro‘yxat hech narsani o‘qilgan qilmaydi', async () => {
  const { read, calls } = load({});
  const updated = await read.markNotificationsRead(OWNER, []);
  assert.equal(updated, 0);
  assert.equal(calls.update, undefined);
});
