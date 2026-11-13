const { test } = require('node:test');
const assert = require('node:assert/strict');

const FOLLOWER = '6a80677eaa8558e009607e22';
const TARGET = '6a6826b38e66e2b6f64b25ac';

const inserted = () => ({
  lastErrorObject: { n: 1, updatedExisting: false, upserted: 'new-follow' },
  value: {
    userId: FOLLOWER,
    type: 'user',
    targetId: TARGET,
    snapshot: { id: TARGET, name: 'Shokhruz', username: 'shokhruz', avatar: '' },
    createdAt: new Date('2026-11-13T12:00:00.000Z'),
  },
});

const repeated = () => ({
  lastErrorObject: { n: 1, updatedExisting: true },
  value: {
    ...inserted().value,
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
  },
});

const load = (setup) => {
  const notificationsPath = require.resolve('../notifications');
  const followingPath = require.resolve('./following.service');
  const userPath = require.resolve('../models/User.model');
  const followingModelPath = require.resolve('../models/Following.model');
  const artistPath = require.resolve('../models/Artist.model');
  const calls = { sent: [] };

  const cacheStub = (filePath, exports) => {
    require.cache[filePath] = { id: filePath, filename: filePath, loaded: true, exports };
  };

  cacheStub(notificationsPath, {
    sendNotification: async (...args) => {
      calls.sent.push(args);
      if (setup.throwSend) throw new Error('yozuv xato');
      return { sent: true };
    },
  });
  cacheStub(userPath, {
    findById(id) {
      return {
        select() {
          return {
            lean: async () => ({
              _id: id,
              name: 'Malika',
              username: 'malika',
              avatar: '',
            }),
          };
        },
      };
    },
  });
  cacheStub(followingModelPath, {
    FOLLOWING_TYPES: ['actor', 'artist', 'channel', 'user'],
    findOneAndUpdate(_filter, _update, options) {
      calls.options = options;
      const result = setup.result;
      if (result?.value) result.value.type = setup.type || result.value.type;
      return { lean: async () => result };
    },
  });
  cacheStub(artistPath, {
    findOne() {
      return { lean: async () => ({ id: 'artist-1', name: 'Artist' }) };
    },
  });

  delete require.cache[followingPath];
  return { service: require('./following.service'), calls };
};

test('yangi foydalanuvchi obunasi xabar yuboradi', async () => {
  const { service, calls } = load({ result: inserted() });
  const item = await service.addFollow(FOLLOWER, { id: TARGET, type: 'user' });

  assert.equal(item.type, 'user');
  assert.equal(calls.options.includeResultMetadata, true);
  assert.deepEqual(calls.sent, [[TARGET, 'subscriber', FOLLOWER]]);
});

test('qayta bosish ikkinchi xabar qilmaydi', async () => {
  const { service, calls } = load({ result: repeated() });
  await service.addFollow(FOLLOWER, { id: TARGET, type: 'user' });
  assert.deepEqual(calls.sent, []);
});

test('o‘ziga obuna xabar yozmaydi', async () => {
  const { service, calls } = load({ result: inserted() });
  await assert.rejects(
    () => service.addFollow(FOLLOWER, { id: FOLLOWER, type: 'user' }),
    (err) => err.status === 400
  );
  assert.deepEqual(calls.sent, []);
  assert.equal(calls.options, undefined);
});

test('aktyor, artist va kanal obunasi xabar qilmaydi', async () => {
  const { service, calls } = load({
    type: 'artist',
    result: {
      lastErrorObject: { n: 1, updatedExisting: false, upserted: 'artist-follow' },
      value: {
        userId: FOLLOWER,
        type: 'artist',
        targetId: 'artist-1',
        snapshot: { id: 'artist-1', name: 'Artist' },
        createdAt: new Date(),
      },
    },
  });
  await service.addFollow(FOLLOWER, { id: 'artist-1', type: 'artist' });
  assert.deepEqual(calls.sent, []);
});

test('xabar xato bersa obuna saqlanadi', async () => {
  const { service } = load({ result: inserted(), throwSend: true });
  const item = await service.addFollow(FOLLOWER, { id: TARGET, type: 'user' });
  assert.equal(item.id, TARGET);
});
