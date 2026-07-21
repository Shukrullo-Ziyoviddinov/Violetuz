import { resolveShortsMusicMeta } from './resolveShortsMusicMeta';

/**
 * Music shorts katalogi:
 * contentType + musicId → klip / music / konsert dan title/img;
 * artistId → artists dan ism.
 */
export function resolveMusicShortsCatalog(
  rawShorts = [],
  musicList = [],
  clipList = [],
  concertList = [],
  artistsList = []
) {
  const list = Array.isArray(rawShorts) ? rawShorts : [];
  return list.map((item) =>
    resolveShortsMusicMeta(item, musicList, clipList, concertList, artistsList)
  );
}
