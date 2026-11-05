// Social crawlers reach this function through /channel/:id on the public domain.
// The backend address stays private to the hosting configuration.
module.exports = async function channelPreview(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'User-Agent');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const id = req.query?.id;
  if (typeof id !== 'string' || !id.trim() || id.length > 200 || /[\x00-\x1f/\\]/.test(id)) {
    return res.status(400).send('Invalid channel id');
  }

  const configuredApi = process.env.MOVIE_API_URL || process.env.REACT_APP_MOVIE_API_URL;
  if (!configuredApi) return res.status(503).send('Channel preview is temporarily unavailable');

  try {
    const api = new URL(configuredApi);
    if (!['http:', 'https:'].includes(api.protocol)) throw new Error('Invalid API URL');
    const base = api.href.replace(/\/+$/, '');
    const apiBase = /\/api(?:\/v1)?$/.test(base) ? base : `${base}/api`;
    const response = await fetch(`${apiBase}/channels/${encodeURIComponent(id)}/share`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'text/html' },
      redirect: 'error',
    });
    if (!response.ok) {
      return res.status(response.status === 404 ? 404 : 502).send('Channel preview is unavailable');
    }
    if (!response.headers.get('content-type')?.includes('text/html')) {
      return res.status(502).send('Channel preview is unavailable');
    }
    // This response already occupies the canonical URL: never redirect it to itself.
    const html = (await response.text())
      .replace(/<meta\b[^>]*http-equiv=["']refresh["'][^>]*>/gi, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
    return res.status(200).send(html);
  } catch {
    return res.status(503).send('Channel preview is temporarily unavailable');
  }
};
