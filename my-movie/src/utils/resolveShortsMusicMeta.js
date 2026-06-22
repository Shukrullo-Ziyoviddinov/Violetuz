import { allMusicData } from '../dataMusic/allMusicData';
import { allClipsData, allConcertsData } from '../dataMusic/wishlistDataConfig';
import { artists } from '../dataMusic/artists';
import { matchId } from '../dataMusic/musicDataUtils';

const normalizeLocalized = (value) => {
  if (!value) return { uz: '', ru: '' };
  if (typeof value === 'string') return { uz: value, ru: value };
  return {
    uz: value.uz || value.ru || value.en || '',
    ru: value.ru || value.uz || value.en || '',
  };
};

const getSourceByContentType = (contentType) => {
  if (contentType === 'klip') return allClipsData || [];
  if (contentType === 'konsert') return allConcertsData || [];
  return allMusicData || [];
};

const resolveArtist = (item) => {
  if (item?.artist) return normalizeLocalized(item.artist);
  if (item?.artistId) {
    const artist = artists.find((a) => a.id === item.artistId);
    const name = artist?.name || item.artistId;
    return { uz: name, ru: name };
  }
  return { uz: '', ru: '' };
};

/**
 * Music shorts: contentType + musicId orqali title, artist, img olinadi.
 */
export function resolveShortsMusicMeta(shortItem) {
  if (!shortItem?.musicId) return shortItem;

  const contentType = shortItem.contentType || 'music';
  const source = getSourceByContentType(contentType);
  const musicItem = source.find((m) => matchId(m.id, shortItem.musicId));
  if (!musicItem) return shortItem;

  return {
    ...shortItem,
    title: normalizeLocalized(musicItem.title),
    artist: resolveArtist(musicItem),
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
