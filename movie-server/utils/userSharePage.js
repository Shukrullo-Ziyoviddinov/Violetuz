const { resolveMediaUrl } = require('./resolveMediaUrl');

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const shareImageUrl = (avatar, base) => {
  const resolved = resolveMediaUrl(avatar);
  if (!resolved) return '';
  try {
    const url = new URL(resolved, base);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
  } catch { /* Invalid optional image: share the profile without it. */ }
  return '';
};

/**
 * Crawler preview for /user/:id.
 * Title is the profile name. Bio is included only when that user has one.
 * The picture is a small JPEG on the same site, so chat apps can show the avatar.
 */
const buildUserSharePage = (user, baseUrl) => {
  const base = new URL(baseUrl).origin;
  const target = `${base}/user/${encodeURIComponent(user.id)}`;
  const name = String(user?.name || '').trim();
  const bio = String(user?.bio || '').trim();
  const title = escapeHtml(name);
  const description = escapeHtml(bio);
  const sourceImage = shareImageUrl(user?.avatar, base);
  const image = sourceImage
    ? escapeHtml(`${base}/user-avatar/${encodeURIComponent(user.id)}.jpg`)
    : '';
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
${image ? `<meta property="og:image" content="${image}" />
<meta property="og:image:secure_url" content="${image}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="512" />
<meta property="og:image:height" content="512" />
<meta property="og:image:alt" content="${title}" />` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${title}" />
${description ? `<meta name="twitter:description" content="${description}" />` : ''}
${image ? `<meta name="twitter:image" content="${image}" />` : ''}
<link rel="canonical" href="${url}" />
<meta http-equiv="refresh" content="0;url=${url}" />
</head><body>
<p>${title}</p>
${description ? `<p>${description}</p>` : ''}
<a href="${url}">${title}</a>
<script>location.replace(${scriptUrl});</script>
</body></html>`;
};

module.exports = { buildUserSharePage, shareImageUrl };
