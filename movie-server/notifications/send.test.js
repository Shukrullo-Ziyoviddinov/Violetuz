const { test } = require('node:test');
const assert = require('node:assert/strict');

const RECIPIENT = '6a6826b38e66e2b6f64b25ac';
const ACTOR = '6a80677eaa8558e009607e22';

const loadSend = (deps) => {
  const path = require.resolve('./send');
  delete require.cache[path];
  delete require.cache[require.resolve('./device')];
  delete require.cache[require.resolve('../models/User.model')];
  delete require.cache[require.resolve('./models/Notification.model')];
  delete require.cache[require.resolve('./models/NotificationSetting.model')];
  delete require.cache[require.resolve('./models')];

  require.cache[require.resolve('../models/User.model')] = {
    id: require.resolve('../models/User.model'),
    filename: require.resolve('../models/User.model'),
    loaded: true,
    exports: deps.User,
  };
  require.cache[require.resolve('./models/Notification.model')] = {
    id: require.resolve('./models/Notification.model'),
    filename: require.resolve('./models/Notification.model'),
    loaded: true,
    exports: deps.Notification,
  };
  require.cache[require.resolve('./models/NotificationSetting.model')] = {
    id: require.resolve('./models/NotificationSetting.model'),
    filename: require.resolve('./models/NotificationSetting.model'),
    loaded: true,
    exports: deps.NotificationSetting,
  };
  require.cache[require.resolve('./device')] = {
    id: require.resolve('./device'),
    filename: require.resolve('./device'),
    loaded: true,
    exports: { sendToDevices: deps.sendToDevices },
  };

  return require('./send');
};

const memory = (overrides = {}) => {
  const calls = { created: null, device: null, userLookups: 0 };
  const deps = {
    User: {
      findById(id) {
        calls.userLookups += 1;
        return {
          select() {
            return {
              lean: async () => ({
                _id: id,
                name: 'Malika',
                username: 'malika',
                avatar: 'https://cdn.example/m.jpg',
                email: 'secret@example.com',
              }),
            };
          },
        };
      },
    },
    NotificationSetting: {
      findOne() {
        return {
          select() {
            return { lean: async () => overrides.setting };
          },
        };
      },
    },
    Notification: {
      async create(doc) {
        calls.created = doc;
        return { _id: 'notice1', ...doc };
      },
    },
    sendToDevices: async (delivery) => {
      calls.device = delivery;
      if (overrides.deviceError) throw new Error('push ulanmagan');
      return { connected: false };
    },
  };
  return { calls, send: loadSend(deps).sendNotification };
};

test('yangi obunachi yozuvi ism va avatarni saqlaydi va qurilmani chaqiradi', async () => {
  const { calls, send } = memory();
  const result = await send(RECIPIENT, 'subscriber', ACTOR);

  assert.equal(result.sent, true);
  assert.equal(calls.created.actor.name, 'Malika');
  assert.equal(calls.created.actor.avatar, 'https://cdn.example/m.jpg');
  assert.equal(calls.created.actor.email, undefined);
  assert.equal(calls.created.userId, RECIPIENT);
  assert.equal(calls.created.type, 'subscriber');
  assert.equal(calls.device.userId, RECIPIENT);
  assert.equal(calls.device.notification.actor.name, 'Malika');
});

test('nusxa berilsa obunachi qayta qidirilmaydi', async () => {
  const { calls, send } = memory();
  await send(RECIPIENT, 'subscriber', {
    id: ACTOR,
    name: 'Malika',
    username: 'malika',
    avatar: '',
    email: 'secret@example.com',
    passwordHash: 'nope',
  });

  assert.equal(calls.userLookups, 0);
  assert.equal(calls.created.actor.email, undefined);
  assert.equal(calls.created.actor.passwordHash, undefined);
  assert.deepEqual(calls.created.actor, {
    id: ACTOR,
    name: 'Malika',
    username: 'malika',
    avatar: '',
  });
});

test('Yangi obunachilar o‘chiq bo‘lsa yozuv ham qurilma ham ketmaydi', async () => {
  const { calls, send } = memory({ setting: { subscribers: false } });
  const result = await send(RECIPIENT, 'subscriber', ACTOR);

  assert.deepEqual(result, { sent: false, reason: 'disabled' });
  assert.equal(calls.created, null);
  assert.equal(calls.device, null);
});

test('boshqa turlar hozir yozilmaydi', async () => {
  const { calls, send } = memory();
  const result = await send(RECIPIENT, 'likes', ACTOR);

  assert.equal(result.sent, false);
  assert.equal(calls.created, null);
  assert.equal(calls.device, null);
});

test('o‘ziga xabar yozilmaydi', async () => {
  const { calls, send } = memory();
  const result = await send(RECIPIENT, 'subscriber', RECIPIENT);

  assert.deepEqual(result, { sent: false, reason: 'self' });
  assert.equal(calls.created, null);
});

test('qurilma xato bersa qo‘ng‘iroqcha yozuvi qoladi', async () => {
  const { calls, send } = memory({ deviceError: true });
  const result = await send(RECIPIENT, 'subscriber', {
    id: ACTOR,
    name: 'Malika',
    avatar: '',
  });

  assert.equal(result.sent, true);
  assert.equal(calls.created.actor.name, 'Malika');
});
