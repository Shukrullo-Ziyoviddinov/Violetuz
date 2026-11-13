const { test } = require('node:test');
const assert = require('node:assert/strict');
const { addClient, publishNotification, toLiveItem } = require('./live');

const OWNER = '6a6826b38e66e2b6f64b25ac';

test('ochiq sahifaga xabar boradi va yopilgach ketmaydi', () => {
  const chunks = [];
  const remove = addClient(OWNER, { write: (chunk) => chunks.push(chunk) });
  const item = toLiveItem({
    _id: 'notice1',
    type: 'subscriber',
    email: 'secret@example.com',
    passwordHash: 'secret',
    actor: {
      id: '6a80677eaa8558e009607e22',
      name: 'Malika',
      username: 'malika',
      avatar: 'https://cdn.example/m.jpg',
      email: 'secret@example.com',
    },
    readAt: null,
    createdAt: '2026-11-13T12:00:00.000Z',
  });

  assert.equal(publishNotification(OWNER, item), 1);
  const packed = chunks.join('');
  assert.match(packed, /^event: notification\ndata: /);
  assert.match(packed, /Malika/);
  assert.equal(packed.includes('secret'), false);
  assert.equal(packed.includes('email'), false);

  remove();
  assert.equal(publishNotification(OWNER, item), 0);
});

test('bitta yopiq sahifa qolgan ochiq sahifani to‘xtatmaydi', () => {
  const OTHER = '6a80677eaa8558e009607e23';
  const chunks = [];
  const removeOpen = addClient(OTHER, { write: (chunk) => chunks.push(chunk) });
  addClient(OTHER, {
    write() {
      throw new Error('yopiq');
    },
  });
  const sent = publishNotification(OTHER, {
    id: 'notice2',
    type: 'subscriber',
    actor: { id: 'a', name: 'Malika', username: '', avatar: '' },
    readAt: null,
    createdAt: null,
  });
  removeOpen();
  assert.equal(sent, 1);
  assert.match(chunks.join(''), /Malika/);
});
