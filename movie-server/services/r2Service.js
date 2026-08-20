const { randomUUID } = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  NODE_ENV,
} = require('../config/env');
const { badRequest, createHttpError } = require('../utils/errors');

/** Default: presigned PUT expires in 10 minutes */
const DEFAULT_PRESIGN_EXPIRES_IN = 600;

/**
 * Object keys are UUID-unique (never overwritten), so immutable CDN cache is safe.
 * Client PUT must send this exact header — it is part of the presign signature.
 */
const OBJECT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const ALLOWED_CONTENT_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/aac',
]);

const MIME_TO_EXT = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/wav': '.wav',
  'audio/webm': '.webm',
  'audio/aac': '.aac',
});

/** Folders any logged-in client may use (profile avatar) */
const CLIENT_UPLOAD_FOLDERS = Object.freeze(['avatars']);

/**
 * Catalog media layout (single rule):
 *   img/    — posters, genre tiles, banner stills, UI-adjacent catalog images
 *   video/  — trailers, shorts, banner videos, clips
 *   music/  — audio tracks
 *   avatars/ — user avatars only
 *
 * Admin uploads MUST use img|video|music (same as seed/migrate), not parallel
 * entity folders like genres/ or banners/ for catalog fields.
 * Nested keys (movie/posters, …) remain allowed for future typed uploads.
 */
const R2_FOLDERS = Object.freeze({
  /** Primary catalog layout (seed, migrate, admin) */
  img: 'img',
  video: 'video',
  music: 'music',
  avatars: 'avatars',
  /** Optional typed prefixes (future); catalog admin uses img|video|music above */
  actors: 'actors',
  ads: 'ads',
  artistMusicStories: 'artistMusicStories',
  artists: 'artists',
  banners: 'banners',
  genres: 'genres',
  klips: 'klips',
  konsert: 'konsert',
  movie: 'movie',
  moviePosters: 'movie/posters',
  movieBanners: 'movie/banners',
  movieTrailers: 'movie/triller',
  musicAlbom: 'musicAlbom',
  musicBanner: 'musicBanner',
  musicShorts: 'musicShorts',
  shortsVideos: 'shortsVideos',
  socialLinks: 'socialLinks',
  triller: 'triller',
  videoBanners: 'videoBanners',
  cache: 'cache',
});

const ALLOWED_FOLDER_SET = new Set(Object.values(R2_FOLDERS));

let s3Client = null;

const isR2Configured = () =>
  Boolean(R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ENDPOINT && R2_BUCKET_NAME && R2_PUBLIC_URL);

const assertR2Configured = () => {
  if (isR2Configured()) return;

  throw createHttpError(
    503,
    'Cloudflare R2 is not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT (or R2_ACCOUNT_ID), R2_BUCKET_NAME, and R2_PUBLIC_URL.'
  );
};

const getR2Client = () => {
  assertR2Configured();

  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3Client;
};

const normalizeFolder = (folder) => {
  const value = String(folder || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');

  if (!value || !ALLOWED_FOLDER_SET.has(value)) {
    throw badRequest(`Invalid R2 folder: ${folder}`, {
      allowedFolders: [...ALLOWED_FOLDER_SET].sort(),
    });
  }

  return value;
};

const getExtension = (filenameOrExt = '') => {
  const raw = String(filenameOrExt || '').trim();
  if (!raw) return '';

  const base = raw.includes('/') ? raw.split('/').pop() : raw;
  const withDot = base.startsWith('.') ? base : base.includes('.') ? `.${base.split('.').pop()}` : '';
  const ext = withDot.toLowerCase().replace(/[^a-z0-9.]/g, '');

  return ext === '.' ? '' : ext;
};

/**
 * Builds a unique object key: folder/uuid.ext
 * Never trust the original client filename beyond its extension.
 */
const buildObjectKey = (folder, originalFilename = '') => {
  const safeFolder = normalizeFolder(folder);
  const ext = getExtension(originalFilename);
  const uniqueName = `${randomUUID()}${ext}`;
  return `${safeFolder}/${uniqueName}`;
};

const getPublicUrl = (objectKey) => {
  assertR2Configured();

  const key = String(objectKey || '')
    .trim()
    .replace(/^\/+/, '');

  if (!key) {
    throw badRequest('objectKey is required');
  }

  return `${R2_PUBLIC_URL}/${key}`;
};

/**
 * Server-side put — for migration scripts / rare ops only.
 * Runtime media upload must use direct-to-R2 (presigned URL), not proxy through Node.
 */
const putObject = async ({ key, body, contentType }) => {
  assertR2Configured();

  const objectKey = String(key || '')
    .trim()
    .replace(/^\/+/, '');

  if (!objectKey) {
    throw badRequest('objectKey is required');
  }

  if (body == null) {
    throw badRequest('body is required');
  }

  const client = getR2Client();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: body,
        ContentType: contentType || 'application/octet-stream',
        CacheControl: OBJECT_CACHE_CONTROL,
      })
    );
  } catch (err) {
    throw createHttpError(502, 'Failed to upload object to R2', {
      key: objectKey,
      cause: err.message,
    });
  }

  return {
    key: objectKey,
    publicUrl: getPublicUrl(objectKey),
  };
};

const deleteObject = async (objectKey) => {
  assertR2Configured();

  const key = String(objectKey || '')
    .trim()
    .replace(/^\/+/, '');

  if (!key) {
    throw badRequest('objectKey is required');
  }

  const client = getR2Client();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (err) {
    throw createHttpError(502, 'Failed to delete object from R2', {
      key,
      cause: err.message,
    });
  }

  return { key, deleted: true };
};

/**
 * Resolve a deletable object key.
 * - Absolute URLs: ONLY accepted if under R2_PUBLIC_URL (no foreign-host pathname spoof).
 * - Relative keys: must be a clean path (no .. / scheme).
 * Returns '' if input is missing or unsafe.
 */
const resolveObjectKey = (urlOrKey) => {
  const value = String(urlOrKey || '').trim();
  if (!value) return '';

  let key = '';

  if (value.startsWith('http://') || value.startsWith('https://')) {
    if (!R2_PUBLIC_URL) return '';

    const base = `${R2_PUBLIC_URL}/`;
    if (value !== R2_PUBLIC_URL && !value.startsWith(base)) {
      // Reject evil.example/.../avatars/x — never take pathname from foreign hosts
      return '';
    }

    key = value === R2_PUBLIC_URL ? '' : value.slice(base.length);
  } else {
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      // block data:, file:, etc.
      return '';
    }
    key = value.replace(/^\/+/, '');
  }

  key = key.split('?')[0].split('#')[0].trim();

  if (!key) return '';
  if (key.includes('..') || key.includes('\\') || key.includes('//')) return '';
  if (key.startsWith('/') || key.endsWith('/')) return '';

  return key;
};

const normalizeContentType = (contentType) => {
  const value = String(contentType || '')
    .trim()
    .toLowerCase()
    .split(';')[0]
    .trim();

  if (!value || !ALLOWED_CONTENT_TYPES.includes(value)) {
    throw badRequest(`Unsupported contentType: ${contentType}`, {
      allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
    });
  }

  return value;
};

/**
 * Client may always use avatars/.
 * Admins may use any allowed catalog folder.
 * Dev-only escape: R2_ALLOW_CATALOG_UPLOAD=true (ignored when NODE_ENV=production).
 */
const assertUploadFolderAccess = (folder, { isAdmin = false } = {}) => {
  const safeFolder = normalizeFolder(folder);

  if (CLIENT_UPLOAD_FOLDERS.includes(safeFolder)) {
    return safeFolder;
  }

  if (isAdmin) {
    return safeFolder;
  }

  const allowCatalogEscape =
    NODE_ENV !== 'production' &&
    String(process.env.R2_ALLOW_CATALOG_UPLOAD || '').trim() === 'true';

  if (allowCatalogEscape) {
    return safeFolder;
  }

  throw createHttpError(
    403,
    NODE_ENV === 'production'
      ? 'Bu folder uchun ruxsat yo‘q. Catalog upload faqat admin role orqali.'
      : 'Bu folder uchun ruxsat yo‘q. Client: avatars/. Catalog: admin role yoki (dev) R2_ALLOW_CATALOG_UPLOAD=true.',
    { folder: safeFolder, clientFolders: [...CLIENT_UPLOAD_FOLDERS] }
  );
};

/**
 * Direct-to-R2: returns a short-lived PUT URL.
 * File bytes never pass through Node — client uploads to uploadUrl.
 */
const createPresignedUpload = async ({
  folder,
  contentType,
  filename = '',
  expiresIn = DEFAULT_PRESIGN_EXPIRES_IN,
  isAdmin = false,
} = {}) => {
  assertR2Configured();

  const safeFolder = assertUploadFolderAccess(folder, { isAdmin });
  const safeContentType = normalizeContentType(contentType);
  const ttl = Math.min(Math.max(Number(expiresIn) || DEFAULT_PRESIGN_EXPIRES_IN, 60), 3600);

  const nameHint = filename || MIME_TO_EXT[safeContentType] || '';
  const key = buildObjectKey(safeFolder, nameHint);
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: safeContentType,
    CacheControl: OBJECT_CACHE_CONTROL,
  });

  let uploadUrl;
  try {
    uploadUrl = await getSignedUrl(client, command, { expiresIn: ttl });
  } catch (err) {
    throw createHttpError(502, 'Failed to create R2 presigned URL', {
      cause: err.message,
    });
  }

  return {
    key,
    publicUrl: getPublicUrl(key),
    uploadUrl,
    expiresIn: ttl,
    headers: {
      'Content-Type': safeContentType,
      'Cache-Control': OBJECT_CACHE_CONTROL,
    },
  };
};

module.exports = {
  R2_FOLDERS,
  ALLOWED_FOLDER_SET,
  ALLOWED_CONTENT_TYPES,
  CLIENT_UPLOAD_FOLDERS,
  isR2Configured,
  assertR2Configured,
  getR2Client,
  buildObjectKey,
  getPublicUrl,
  putObject,
  deleteObject,
  resolveObjectKey,
  normalizeContentType,
  assertUploadFolderAccess,
  createPresignedUpload,
};
