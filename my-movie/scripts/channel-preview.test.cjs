const { test } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/channel-preview');
const config = require('../vercel.json');

async function request(id, upstream, env = 'https://backend.example/api') {
  const previousFetch = global.fetch;
  const previousApi = process.env.MOVIE_API_URL;
  process.env.MOVIE_API_URL = env;
  let fetchedUrl;
  global.fetch = async (url) => { fetchedUrl = url; return upstream; };
  const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; }, send(body) { this.body = body; return this; } };
  try {
    await handler({ query: { id } }, response);
    return { ...response, fetchedUrl };
  } finally {
    global.fetch = previousFetch;
    if (previousApi === undefined) delete process.env.MOVIE_API_URL;
    else process.env.MOVIE_API_URL = previousApi;
  }
}

test('public channel preview retains metadata and removes self redirects', async () => {
  const result = await request('violet-play', {
    ok: true, headers: new Headers({ 'content-type': 'text/html' }),
    text: async () => '<meta property="og:title" content="Channel"><meta http-equiv="refresh" content="0;url=x"><script>location.replace("x")</script>',
  });
  assert.equal(result.code, 200);
  assert.equal(result.fetchedUrl, 'https://backend.example/api/channels/violet-play/share');
  assert.ok(result.body.includes('og:title'));
  assert.ok(!result.body.includes('refresh'));
  assert.ok(!result.body.includes('<script'));
  assert.equal(result.headers['Cache-Control'], 'no-store');
});

test('rejects invalid channel ids before contacting backend', async () => {
  const result = await request('../bad');
  assert.equal(result.code, 400);
  assert.equal(result.fetchedUrl, undefined);
});

test('missing channels return 404 without exposing upstream details', async () => {
  const result = await request('missing', { ok: false, status: 404 });
  assert.equal(result.code, 404);
  assert.ok(!result.body.includes('backend.example'));
});

test('changing backend origin does not change public route', async () => {
  const result = await request('channel', { ok: false, status: 503 }, 'https://new-backend.example');
  assert.equal(result.fetchedUrl, 'https://new-backend.example/api/channels/channel/share');
  assert.equal(result.code, 502);
  const [crawler, visitor] = config.rewrites;
  assert.equal(crawler.source, '/channel/:id');
  assert.equal(visitor.source, '/channel/:id');
  assert.equal(visitor.destination, '/index.html');
  const matcher = new RegExp(`^${crawler.has[0].value}$`);
  for (const agent of ['TelegramBot (like TwitterBot)', 'facebookexternalhit/1.1', 'WhatsApp/2', 'Discordbot/2']) {
    assert.ok(matcher.test(agent));
  }
  assert.ok(!matcher.test('Mozilla/5.0 Chrome/130.0 Safari/537.36'));
});
