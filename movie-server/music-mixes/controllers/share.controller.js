/**
 * POST /api/music/mixes/share
 * GET  /api/music/mixes/share/:token       (public JSON)
 * GET  /api/music/mixes/share/:token/card  (public OG HTML → client redirect)
 *
 * @module music-mixes/controllers/share.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { badRequest, notFound } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/response');
const { CLIENT_URL } = require('../../config/env');
const { resolveMediaUrl } = require('../../utils/resolveMediaUrl');
const { normalizeMixContentType } = require('../contentType');
const { createUserMixShare } = require('../services/createMixShare.service');
const { getMixShareByToken } = require('../services/getMixShare.service');

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** OG / Telegram preview — R2 custom domain (media.violetplay.uz). */
const absoluteAssetUrl = (src) => {
  const resolved = resolveMediaUrl(src);
  if (/^https?:\/\//i.test(resolved)) return resolved;
  const raw = String(src || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = String(CLIENT_URL || '').replace(/\/$/, '');
  if (!base) return raw;
  return `${base}${raw.startsWith('/') ? raw : `/${raw}`}`;
};

const clientMixPath = (share) => {
  const type = normalizeMixContentType(share.contentType);
  const leadId = encodeURIComponent(String(share.leadId || '').trim());
  const token = encodeURIComponent(String(share.token || '').trim());
  const basePath = type === 'klip' ? `/music/video/${leadId}` : `/music/${leadId}`;
  return `${basePath}?ms=${token}`;
};

const postMixShare = asyncHandler(async (req, res) => {
  const genre = String(req.body?.genre ?? '').trim();
  const contentType = normalizeMixContentType(req.body?.contentType);

  if (!genre) {
    throw badRequest('genre kerak');
  }

  const share = await createUserMixShare({
    userId: req.authUser._id,
    contentType,
    genre,
  });

  return sendSuccess(res, {
    data: {
      token: share.token,
      contentType: share.contentType,
      genre: share.genre,
      leadId: share.leadId,
      coverImg: share.coverImg,
      trackCount: share.trackCount,
      expiresAt: share.expiresAt,
    },
  });
});

const getMixShare = asyncHandler(async (req, res) => {
  const token = String(req.params?.token ?? '').trim();
  if (!token) {
    throw badRequest('token kerak');
  }

  const share = await getMixShareByToken(token);
  if (share.expired) {
    throw notFound('share muddati o‘tgan');
  }

  return sendSuccess(res, {
    data: {
      token: share.token,
      contentType: share.contentType,
      genre: share.genre,
      leadId: share.leadId,
      coverImg: share.coverImg,
      tracks: share.tracks,
      expiresAt: share.expiresAt,
    },
  });
});

/** Telegram / crawler uchun OG + clientga yo'naltirish. */
const getMixShareCard = asyncHandler(async (req, res) => {
  const token = String(req.params?.token ?? '').trim();
  if (!token) {
    throw badRequest('token kerak');
  }

  const share = await getMixShareByToken(token, { allowExpired: true });
  const clientBase = String(CLIENT_URL || '').replace(/\/$/, '') || 'https://violetuz.vercel.app';

  if (share.expired) {
    const home = escapeHtml(clientBase);
    res
      .status(410)
      .type('html')
      .send(`<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <title>Mix muddati tugagan</title>
  <meta name="robots" content="noindex" />
</head>
<body>
  <p>Bu mix havolasining muddati tugagan.</p>
  <p><a href="${home}">Bosh sahifa</a></p>
</body>
</html>`);
    return;
  }

  const targetPath = clientMixPath(share);
  const targetUrl = `${clientBase}${targetPath}`;
  const title = escapeHtml(`${share.genre || 'Mix'} janerdagi mixlar`);
  const description = escapeHtml(
    `${Array.isArray(share.tracks) ? share.tracks.length : 0} ta trek — Violet Mix`
  );
  const image = escapeHtml(absoluteAssetUrl(share.coverImg));
  const url = escapeHtml(targetUrl);

  res
    .status(200)
    .type('html')
    .send(`<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="music.playlist" />
  <meta property="og:site_name" content="Violet" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${url}" />
  ${image ? `<meta property="og:image" content="${image}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  ${image ? `<meta name="twitter:image" content="${image}" />` : ''}
  <meta http-equiv="refresh" content="0;url=${url}" />
  <link rel="canonical" href="${url}" />
</head>
<body>
  <p><a href="${url}">Mixni ochish</a></p>
  <script>location.replace(${JSON.stringify(targetUrl)});</script>
</body>
</html>`);
});

module.exports = {
  postMixShare,
  getMixShare,
  getMixShareCard,
};
