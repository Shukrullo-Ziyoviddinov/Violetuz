const { test } = require('node:test');
const assert = require('node:assert/strict');
const { addClient, publishChatMessage, toLiveMessage } = require('./live');

const OWNER = '6a6826b38e66e2b6f64b25ac';

test('ochiq chatga xabar boradi va sirlar chiqmaydi', () => {
  const chunks = [];
  const remove = addClient(OWNER, { write: (chunk) => chunks.push(chunk) });
  const item = toLiveMessage({
    _id: 'msg1',
    conversationId: 'conv1',
    senderId: '6a80677eaa8558e009607e22',
    recipientId: OWNER,
    text: 'Salom',
    email: 'secret@example.com',
    passwordHash: 'secret',
    createdAt: '2026-11-14T12:00:00.000Z',
  });

  assert.equal(publishChatMessage(OWNER, item), 1);
  const packed = chunks.join('');
  assert.match(packed, /^event: chat\ndata: /);
  assert.match(packed, /Salom/);
  assert.equal(packed.includes('secret'), false);
  assert.equal(packed.includes('email'), false);

  remove();
  assert.equal(publishChatMessage(OWNER, item), 0);
});

test('id harfi katta yozilsa ham shu ochiq sahifaga boradi', () => {
  const chunks = [];
  const remove = addClient(OWNER.toUpperCase(), { write: (chunk) => chunks.push(chunk) });
  const sent = publishChatMessage(OWNER, {
    id: 'msg-case',
    conversationId: 'conv',
    senderId: 'a',
    recipientId: OWNER,
    text: 'Ha',
    createdAt: null,
  });
  remove();
  assert.equal(sent, 1);
  assert.match(chunks.join(''), /Ha/);
});

test('bitta yozish xatosi qolgan ochiq chatni to‘xtatmaydi', () => {
  const OTHER = '6a80677eaa8558e009607e23';
  const chunks = [];
  const removeOpen = addClient(OTHER, { write: (chunk) => chunks.push(chunk) });
  addClient(OTHER, {
    write() {
      throw new Error('yopiq');
    },
  });
  const sent = publishChatMessage(OTHER, {
    id: 'msg2',
    conversationId: 'conv2',
    senderId: 'a',
    recipientId: OTHER,
    text: 'Yana',
    createdAt: null,
  });
  removeOpen();
  assert.equal(sent, 1);
  assert.match(chunks.join(''), /Yana/);
});
