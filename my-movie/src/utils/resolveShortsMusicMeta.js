import { matchId } from './musicDataUtils';

const normalizeLocalized = (value) => {
  if (!value) return { uz: '', ru: '' };
  if (typeof value === 'string') return { uz: value, ru: value };
  return {
    uz: value.uz || value.ru || value.en || '',
    ru: value.ru || value.uz || value.en || '',
  };
};

const getSourceByContentType = (contentType, musicList = [], clipList = [], concertList = []) => {
  if (contentType === 'klip') return Array.isArray(clipList) ? clipList : [];
  if (contentType === 'konsert') return Array.isArray(concertList) ? concertList : [];
  return Array.isArray(musicList) ? musicList : [];
};

const resolveArtist = (item, artistsList = []) => {
  if (item?.artist) return normalizeLocalized(item.artist);
  if (item?.artistId) {
    const artist = artistsList.find((a) => a.id === item.artistId);
    const name = artist?.name || item.artistId;
    return { uz: name, ru: name };
  }
  return { uz: '', ru: '' };
};

/**
 * Music shorts: contentType + musicId orqali title, artist, img olinadi.
 */
export function resolveShortsMusicMeta(
  shortItem,
  musicList = [],
  clipList = [],
  concertList = [],
  artistsList = []
) {
  if (!shortItem?.musicId) return shortItem;

  const contentType = shortItem.contentType || 'music';
  const source = getSourceByContentType(contentType, musicList, clipList, concertList);
  const musicItem = source.find((m) => matchId(m.id, shortItem.musicId));
  if (!musicItem) return shortItem;

  return {
    ...shortItem,
    title: normalizeLocalized(musicItem.title),
    artist: resolveArtist(musicItem, artistsList),
    musicImg: musicItem.img || '',
    artistId: musicItem.artistId || shortItem.artistId,
  };
}

export function getShortsMusicLinkPath(item) {
  const ct = item?.contentType;
  const id = item?.musicId;
  if (!id) return '/music';
  if (ct === 'klip' || ct === 'konsert') return `/music/video/${id}`;
  return `/music/${id}`;
}
