/**
 * Eski mix qatorlariga contentType: music yozadi va kalitni yangilaydi.
 * Server so'rov olishidan oldin bir marta ishlaydi.
 *
 * @module music-mixes/models/ensureMixContentType
 */

'use strict';

const { MusicMix, MusicMixPlayCount } = require('./index');

const ensureMixContentType = async () => {
  await Promise.all([
    MusicMix.updateMany(
      { contentType: { $exists: false } },
      { $set: { contentType: 'music' } }
    ),
    MusicMixPlayCount.updateMany(
      { contentType: { $exists: false } },
      { $set: { contentType: 'music' } }
    ),
  ]);

  // Eski unique indekslar (contentType siz) qolsa yangi yozuvlar 11000 beradi.
  const dropLegacy = async (model, names) => {
    const coll = model.collection;
    let existing = [];
    try {
      existing = await coll.indexes();
    } catch {
      return;
    }
    const have = new Set(existing.map((idx) => idx.name));
    for (const name of names) {
      if (!have.has(name)) continue;
      try {
        await coll.dropIndex(name);
      } catch {
        /* yo'q yoki band */
      }
    }
  };

  await dropLegacy(MusicMix, ['userId_1_genre_1_contentId_1', 'userId_1_contentId_1']);
  await dropLegacy(MusicMixPlayCount, ['userId_1_contentId_1']);

  await Promise.all([
    MusicMix.syncIndexes(),
    MusicMixPlayCount.syncIndexes(),
  ]);
};

module.exports = {
  ensureMixContentType,
};
