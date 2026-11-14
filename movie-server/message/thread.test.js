const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pairKeyFor, cleanText, toPublicPeer, toClientMessage } = require('./thread');

test('bir xil juftlik harf katta-kichigida ham bitta suhbat kaliti', () => {
  const left = '6a6826b38e66e2b6f64b25ac';
  const right = '6A80677EAA8558E009607E22';
  assert.equal(pairKeyFor(left, right), pairKeyFor(right.toLowerCase(), left.toUpperCase()));
  assert.equal(pairKeyFor(left, left), `${left}:${left}`);
});

test('bo‘sh xabar rad etiladi va sirlar chiqmaydi', () => {
  assert.throws(() => cleanText('   '), (err) => err.status === 400);
  assert.throws(() => cleanText({ text: 'Salom' }), (err) => err.status === 400);
  assert.equal(cleanText('  Salom  '), 'Salom');

  const peer = toPublicPeer({
    _id: '6a6826b38e66e2b6f64b25ac',
    name: 'Shokhruz',
    username: 'Shokhruz',
    avatar: '',
    email: 'secret@example.com',
    passwordHash: 'secret',
  });
  const message = toClientMessage({
    _id: 'msg1',
    conversationId: 'conv1',
    senderId: '6a6826b38e66e2b6f64b25ac',
    recipientId: '6a80677eaa8558e009607e22',
    text: 'Salom',
    email: 'secret@example.com',
  });
  assert.equal(JSON.stringify({ peer, message }).includes('secret'), false);
  assert.equal(message.text, 'Salom');
});
