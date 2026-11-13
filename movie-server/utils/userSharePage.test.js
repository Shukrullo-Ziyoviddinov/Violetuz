const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildUserSharePage } = require('./userSharePage');

const SITE_COPY = 'Violet Movie - Filmlar va seriallar onlayn';

test('user share card leads with the name, then bio and avatar, and keeps the user url', () => {
  const html = buildUserSharePage({
    id: '6a6826b38e66e2b6f64b25ac',
    name: 'Shokhruz',
    bio: 'Kinolar bu ber dunyo',
    avatar: 'https://cdn.example.com/a.jpg',
  }, 'https://www.violetplay.uz');

  const titleAt = html.indexOf('og:title" content="Shokhruz"');
  const bioAt = html.indexOf('og:description" content="Kinolar bu ber dunyo"');
  assert.ok(titleAt > -1 && bioAt > titleAt);
  assert.ok(html.includes('content="https://www.violetplay.uz/user-avatar/6a6826b38e66e2b6f64b25ac.jpg"'));
  assert.ok(!html.includes('user-avatar?id='));
  assert.ok(html.includes('og:image:width" content="512"'));
  assert.ok(html.includes('og:image:height" content="512"'));
  assert.ok(html.includes('og:image:type" content="image/jpeg"'));
  assert.ok(html.includes('content="https://www.violetplay.uz/user/6a6826b38e66e2b6f64b25ac"'));
  assert.ok(html.includes('location.replace("https://www.violetplay.uz/user/6a6826b38e66e2b6f64b25ac")'));
  assert.ok(!html.includes(SITE_COPY));
  assert.ok(!html.includes('Hollywood'));
});

test('user share card omits bio and avatar when the profile has neither', () => {
  const html = buildUserSharePage({
    id: '6a6826b38e66e2b6f64b25ac',
    name: 'Shokhruz',
    bio: '   ',
    avatar: '',
  }, 'https://www.violetplay.uz');

  assert.ok(html.includes('<title>Shokhruz</title>'));
  assert.ok(!html.includes('og:description'));
  assert.ok(!html.includes('og:image'));
  assert.ok(!html.includes(SITE_COPY));
});

test('user share HTML escapes the name and drops unsafe avatar urls', () => {
  const html = buildUserSharePage({
    id: '6a6826b38e66e2b6f64b25ac',
    name: '"><script>alert(1)</script>',
    bio: '<b>bio</b>',
    avatar: 'javascript:alert(1)',
  }, 'https://www.violetplay.uz');

  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&lt;b&gt;bio&lt;/b&gt;'));
  assert.ok(!html.includes('og:image'));
});
