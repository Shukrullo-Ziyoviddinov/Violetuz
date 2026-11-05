const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const buildChannelSharePage = (channel, baseUrl) => {
  const base = new URL(baseUrl).origin;
  const target = `${base}/channel/${encodeURIComponent(channel.id)}`;
  const title = escapeHtml(channel.name);
  const description = escapeHtml(channel.biografiya?.text || `${channel.name} — VioletPlay`);
  let image = '';
  if (channel.avatar) {
    try {
      const url = new URL(channel.avatar, base);
      if (url.protocol === 'https:' || url.protocol === 'http:') image = escapeHtml(url.href);
    } catch { /* Invalid optional image: share the channel without it. */ }
  }
  const url = escapeHtml(target);
  const scriptUrl = JSON.stringify(target).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="uz"><head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="VioletPlay" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${url}" />
${image ? `<meta property="og:image" content="${image}" />` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
${image ? `<meta name="twitter:image" content="${image}" />` : ''}
<link rel="canonical" href="${url}" />
<meta http-equiv="refresh" content="0;url=${url}" />
</head><body>
<a href="${url}">${title}</a>
<script>location.replace(${scriptUrl});</script>
</body></html>`;
};

module.exports = { buildChannelSharePage };
