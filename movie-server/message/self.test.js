const { test } = require('node:test');
const assert = require('node:assert/strict');
const { toMessageSelf } = require('./self');

test('message self keeps the public card and drops secrets', () => {
  const card = toMessageSelf({
    _id: '6a6826b38e66e2b6f64b25ac',
    name: 'Shokhruz',
    username: 'Shokhruz',
    avatar: 'https://cdn.example/avatar.jpg',
    email: 'secret@example.com',
    passwordHash: 'secret',
    role: 'admin',
  });

  assert.deepEqual(card, {
    id: '6a6826b38e66e2b6f64b25ac',
    name: 'Shokhruz',
    username: 'Shokhruz',
    avatar: 'https://cdn.example/avatar.jpg',
  });
  assert.equal(JSON.stringify(card).includes('secret'), false);
  assert.equal(JSON.stringify(card).includes('admin'), false);
});

test('message self is empty without a name', () => {
  assert.equal(toMessageSelf({ _id: '6a6826b38e66e2b6f64b25ac', email: 'a@b.c' }), null);
  assert.equal(toMessageSelf(null), null);
});
