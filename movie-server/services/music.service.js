const MusicModel = require('../models/Music.model');
const { badRequest, notFound } = require('../utils/errors');
const { syncMusicFingerprintAfterSave } = require('./fingerprint/musicFingerprintSync');

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, ...rest } = plain;
  return rest;
};

const WRITABLE_FIELDS = [
  'categoryNameMusic',
  'artistId',
  'img',
  'title',
  'year',
  'genre',
  'language',
  'country',
  'type',
  'audio',
  'lyricsText',
];

const shouldSyncFingerprint = ({ audio, previousAudio, fingerprint }) => {
  if (!audio) return false;
  if (!fingerprint) return true;
  return String(audio) !== String(previousAudio || '');
};

class MusicService {
  async getAll(filters = {}) {
    const query = {};

    if (filters.categoryNameMusic) {
      query.categoryNameMusic = filters.categoryNameMusic;
    }

    if (filters.artistId) {
      query.artistId = filters.artistId;
    }

    if (filters.search) {
      const escaped = String(filters.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escaped) {
        query.$or = [
          { title: { $regex: escaped, $options: 'i' } },
          { genre: { $regex: escaped, $options: 'i' } },
          { artistId: { $regex: escaped, $options: 'i' } },
        ];
      }
    }

    const items = await MusicModel.find(query).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid music id: ${id}`);
    }

    const music = await MusicModel.findOne({ id: numericId }).lean();
    if (!music) {
      throw notFound(`Music not found: ${id}`);
    }

    return stripMongoId(music);
  }

  async getByCategory(categoryNameMusic) {
    const items = await MusicModel.find({ categoryNameMusic }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getByArtist(artistId) {
    const items = await MusicModel.find({ artistId }).sort({ id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async create(musicData) {
    const { id: _oldId, fingerprint: _fp, fingerprintDuration: _fpd, ...rest } = musicData || {};
    if (rest.categoryNameMusic) {
      rest.categoryNameMusic = String(rest.categoryNameMusic).trim();
    }

    const music = new MusicModel(rest);
    await music.save();
    const saved = stripMongoId(music);

    if (saved.audio) {
      await syncMusicFingerprintAfterSave(saved.id, { reason: 'create' });
    }

    return this.getById(saved.id);
  }

  async updateById(id, patch = {}) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw badRequest(`Invalid music id: ${id}`);
    }

    const music = await MusicModel.findOne({ id: numericId });
    if (!music) {
      throw notFound(`Music not found: ${id}`);
    }

    const previousAudio = music.audio;
    const updates = {};

    WRITABLE_FIELDS.forEach((field) => {
      if (patch[field] === undefined) return;
      updates[field] = patch[field];
    });

    if (updates.categoryNameMusic) {
      updates.categoryNameMusic = String(updates.categoryNameMusic).trim();
    }

    Object.assign(music, updates);
    await music.save();

    if (
      shouldSyncFingerprint({
        audio: music.audio,
        previousAudio,
        fingerprint: music.fingerprint,
      })
    ) {
      await syncMusicFingerprintAfterSave(music.id, { reason: 'update' });
    }

    return this.getById(music.id);
  }

  /** Admin / qo'lda qayta fingerprint (keyin endpoint ulanadi) */
  async refreshFingerprint(id) {
    const music = await this.getById(id);
    if (!music.audio) {
      throw badRequest('Musiqada audio yo\'q');
    }

    const result = await syncMusicFingerprintAfterSave(music.id, { reason: 'manual-refresh' });
    if (!result.synced) {
      throw badRequest(result.error || result.reason || 'Fingerprint yaratib bo\'lmadi');
    }

    return this.getById(music.id);
  }
}

module.exports = new MusicService();
