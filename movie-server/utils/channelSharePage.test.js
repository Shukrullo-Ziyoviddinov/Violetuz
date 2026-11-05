const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildChannelSharePage } = require('./channelSharePage');

test('channel share metadata uses server channel details and redirects to its id', () => {
  const html = buildChannelSharePage({
    id: 'violet-play', name: 'Violet Channel', avatar: '/img/channel.jpg', biografiya: { text: 'Channel biography' },
  }, 'https://www.violetplay.uz');
  assert.ok(html.includes('<meta property="og:title" content="Violet Channel"'));
  assert.ok(html.includes('content="https://www.violetplay.uz/img/channel.jpg"'));
  assert.ok(html.includes('content="Channel biography"'));
  assert.ok(html.includes('location.replace("https://www.violetplay.uz/channel/violet-play")'));
});

test('share HTML escapes channel content and safely encodes channel ids', () => {
  const html = buildChannelSharePage({ id: 'a/b?c', name: '"><script>alert(1)</script>', avatar: 'javascript:alert(1)' }, 'https://www.violetplay.uz');
  assert.ok(html.includes('/channel/a%2Fb%3Fc'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('og:image'));
});
