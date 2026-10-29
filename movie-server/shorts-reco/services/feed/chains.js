'use strict';

/**
 * Unseen steps run first. Only steps marked `repeats` may be shown again.
 * @param {{ source: string, mode?: string }} slot
 * @param {object|null} anchor
 * @returns {object[]}
 */
const chainFor = (slot, anchor) => {
  const source = slot.source;
  if (source === 'sameMovie') return [{ source, step: 'movie', repeats: true }];
  if (source === 'sameMusic') {
    const middle = anchor && anchor.songGroupId
      ? [
        { source, step: 'klip', repeats: false },
        { source, step: 'konsert', repeats: false },
      ]
      : [{ source, step: 'artistType', repeats: false }];
    return [{ source, step: 'musicKey', repeats: true }, ...middle];
  }
  if (source === 'sameArtist') {
    if (slot.mode === 'fromMovie' && !(anchor && anchor.artistId)) return [];
    if (slot.mode === 'klipKonsert') {
      return [
        { source, step: 'klip', repeats: false },
        { source, step: 'konsert', repeats: false },
      ];
    }
    return [
      { source, step: 'other', repeats: true },
      { source, step: 'klip', repeats: false },
      { source, step: 'konsert', repeats: false },
    ];
  }
  if (source === 'bridge') {
    if (anchor && anchor.kind === 'music') {
      return [
        { source, step: 'movieMusic', repeats: false },
        { source, step: 'movieTaste', repeats: false },
      ];
    }
    return [
      { source, step: 'musicKey', repeats: false },
      { source, step: 'songGroup', repeats: false },
      { source, step: 'artist', repeats: false },
      { source, step: 'musicTaste', repeats: false },
    ];
  }
  if (source === 'similar' || source === 'actor' || source === 'profile' || source === 'explore') {
    return [{ source, step: source, repeats: false }];
  }
  return [];
};

/**
 * SIMILAR, then PROFILE, then EXPLORE. Explore has nowhere else to go.
 * @param {string} source
 * @returns {string[]}
 */
const fallbacksFor = (source) => {
  if (source === 'explore') return [];
  if (source === 'profile') return ['explore'];
  if (source === 'similar') return ['profile', 'explore'];
  return ['similar', 'profile', 'explore'];
};

module.exports = {
  chainFor,
  fallbacksFor,
};
