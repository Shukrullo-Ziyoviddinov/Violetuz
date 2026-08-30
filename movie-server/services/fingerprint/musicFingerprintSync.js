const { NODE_ENV } = require('../../config/env');
const { upsertMusicFingerprint } = require('./fingerprint.service');
const { checkFingerprintTools } = require('./fpcalcRunner');

const isAutoSyncEnabled = () => String(process.env.FINGERPRINT_AUTO_SYNC || 'true').toLowerCase() !== 'false';

let toolsCache = null;

const hasFingerprintTools = async () => {
  if (toolsCache) return toolsCache;
  const status = await checkFingerprintTools();
  toolsCache = Boolean(status.fpcalc && status.ffmpeg);
  return toolsCache;
};

/**
 * Musiqa saqlangandan keyin fingerprint yozish (admin kelganda ham shu).
 * Xato bo'lsa musiqa saqlanishini buzmaydi — faqat log.
 */
const syncMusicFingerprintAfterSave = async (musicId, { reason = 'save' } = {}) => {
  if (!musicId) {
    return { skipped: true, reason: 'missing-id' };
  }

  if (!isAutoSyncEnabled()) {
    return { skipped: true, reason: 'auto-sync-disabled' };
  }

  try {
    const ready = await hasFingerprintTools();
    if (!ready) {
      if (NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[fingerprint] skip id=${musicId} (${reason}): fpcalc/ffmpeg yo'q`);
      }
      return { skipped: true, reason: 'tools-unavailable' };
    }

    const result = await upsertMusicFingerprint(musicId);
    // eslint-disable-next-line no-console
    console.log(`[fingerprint] synced id=${musicId} (${reason}) duration=${result.duration}s`);
    return { synced: true, ...result };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[fingerprint] sync failed id=${musicId} (${reason}): ${err.message}`);
    return { synced: false, error: err.message };
  }
};

module.exports = {
  syncMusicFingerprintAfterSave,
};
