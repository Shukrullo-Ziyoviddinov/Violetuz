const { R2_PUBLIC_URL } = require('../config/env');
const { badRequest, createHttpError } = require('./errors');

const MEDIA_URL_MAX = 800;

/**
 * Shared R2 media URL validator (catalog + avatar).
 *
 * @param {unknown} value
 * @param {object} [opts]
 * @param {string} [opts.field]
 * @param {boolean} [opts.allowEmpty=true]
 * @param {boolean} [opts.allowLegacyRelative=true] — /img|/video|/music during transition
 * @param {string} [opts.requirePrefix] — e.g. 'avatars/'
 * @param {number} [opts.maxLength]
 * @returns {string|undefined}
 */
const assertR2MediaUrl = (
  value,
  {
    field = 'media',
    allowEmpty = true,
    allowLegacyRelative = true,
    requirePrefix = '',
    maxLength = MEDIA_URL_MAX,
  } = {}
) => {
  if (value === undefined) return undefined;

  const raw = String(value ?? '').trim();
  if (!raw) {
    if (!allowEmpty) {
      throw badRequest(`${field} majburiy`);
    }
    return '';
  }

  if (raw.startsWith('data:') || raw.includes(';base64,') || /base64/i.test(raw)) {
    throw badRequest(`${field} base64 qabul qilinmaydi — R2 URL yuboring`);
  }

  if (raw.length > maxLength) {
    throw badRequest(`${field} URL juda uzun`);
  }

  if (!R2_PUBLIC_URL) {
    throw createHttpError(503, 'R2_PUBLIC_URL sozlanmagan');
  }

  const base = `${R2_PUBLIC_URL}/`;
  const isR2Url = raw.startsWith(base);

  if (!isR2Url) {
    if (
      allowLegacyRelative &&
      (raw.startsWith('/img/') || raw.startsWith('/video/') || raw.startsWith('/music/'))
    ) {
      return raw;
    }
    throw badRequest(
      allowLegacyRelative
        ? `${field} faqat R2 public URL yoki /img|/video|/music path bo‘lishi kerak`
        : `${field} faqat R2 public URL bo‘lishi kerak`
    );
  }

  const key = raw.slice(base.length);
  if (requirePrefix && !key.startsWith(requirePrefix)) {
    throw badRequest(`${field} object key ${requirePrefix} ostida bo‘lishi kerak`);
  }

  return raw;
};

module.exports = {
  assertR2MediaUrl,
};
