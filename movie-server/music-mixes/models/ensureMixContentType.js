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
  await Promise.all([
    MusicMix.syncIndexes(),
    MusicMixPlayCount.syncIndexes(),
  ]);
};

module.exports = {
  ensureMixContentType,
};
