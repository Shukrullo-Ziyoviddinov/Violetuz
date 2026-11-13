// Chat apps load this JPEG from the same site as the profile link.
// The backend resizes the avatar; this function only forwards that file.
module.exports = async function userAvatar(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Content-Type', 'image/jpeg');

  const raw = String(req.query?.file || req.query?.id || '');
  const id = raw.replace(/\.jpe?g$/i, '');
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return res.status(400).end();
  }

  const configuredApi = process.env.MOVIE_API_URL || process.env.REACT_APP_MOVIE_API_URL;
  if (!configuredApi) return res.status(503).end();

  try {
    const api = new URL(configuredApi);
    if (!['http:', 'https:'].includes(api.protocol)) throw new Error('Invalid API URL');
    const base = api.href.replace(/\/+$/, '');
    const apiBase = /\/api(?:\/v1)?$/.test(base) ? base : `${base}/api`;
    const response = await fetch(`${apiBase}/users/${encodeURIComponent(id)}/share-image`, {
      signal: AbortSignal.timeout(12000),
      redirect: 'error',
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('image/')) {
      return res.status(response.status === 404 ? 404 : 502).end();
    }
    const body = Buffer.from(await response.arrayBuffer());
    return res.status(200).send(body);
  } catch {
    return res.status(503).end();
  }
};
