const sharp = require('sharp');
const { shareImageUrl } = require('./userSharePage');

const MAX_BYTES = 8 * 1024 * 1024;
const cache = new Map();

const renderShareAvatar = async (avatar, baseUrl) => {
  const source = shareImageUrl(avatar, baseUrl);
  if (!source) return null;

  const cached = cache.get(source);
  if (cached) return cached;

  const response = await fetch(source, {
    signal: AbortSignal.timeout(8000),
    redirect: 'follow',
  });
  if (!response.ok) return null;

  const buf = Buffer.from(await response.arrayBuffer());
  if (!buf.length || buf.length > MAX_BYTES) return null;

  const jpeg = await sharp(buf, { limitInputPixels: 16_000_000 })
    .rotate()
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 80 })
    .toBuffer();

  if (cache.size > 100) cache.clear();
  cache.set(source, jpeg);
  return jpeg;
};

module.exports = { renderShareAvatar };
