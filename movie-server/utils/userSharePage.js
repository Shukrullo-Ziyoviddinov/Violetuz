const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

/**
 * Crawler preview for /user/:id.
 * Name first, then bio when the user has one. No avatar image.
 */
const buildUserSharePage = (user, baseUrl) => {
  const base = new URL(baseUrl).origin;
  const target = `${base}/user/${encodeURIComponent(user.id)}`;
  const name = String(user?.name || '').trim();
  const bio = String(user?.bio || '').trim();
  const title = escapeHtml(name);
  const description = escapeHtml(bio);
  const url = escapeHtml(target);
  const scriptUrl = JSON.stringify(target).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="uz"><head>
<meta charset="utf-8" />
<title>${title}</title>
${description ? `<meta name="description" content="${description}" />` : ''}
<meta property="og:type" content="website" />
<meta property="og:title" content="${title}" />
${description ? `<meta property="og:description" content="${description}" />` : ''}
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${title}" />
${description ? `<meta name="twitter:description" content="${description}" />` : ''}
<link rel="canonical" href="${url}" />
<meta http-equiv="refresh" content="0;url=${url}" />
</head><body>
<p>${title}</p>
${description ? `<p>${description}</p>` : ''}
<a href="${url}">${title}</a>
<script>location.replace(${scriptUrl});</script>
</body></html>`;
};

module.exports = { buildUserSharePage };
