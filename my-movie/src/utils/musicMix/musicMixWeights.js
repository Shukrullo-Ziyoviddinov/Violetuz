/**
 * FE mirror of movie-server/music-mixes/config/musicMixWeights.js
 * Guest assemble va signal shu sonlardan o‘qiydi — server bilan bir xil qoidalar.
 * Rec / tinglandi formulasiga tegilmaydi.
 */

export const musicMixWeights = Object.freeze({
  minListenRatio: 0.8,
  minPlays: 3,
  minMixSize: 4,
  mixSize: 25,
  unknownGenre: 'Boshqa',
});
