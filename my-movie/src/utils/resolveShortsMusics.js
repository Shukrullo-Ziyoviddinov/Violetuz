import { matchId } from './musicDataUtils';

const normalizeTitle = (title) => {
  if (!title) return { uz: '', ru: '' };
  if (typeof title === 'string') return { uz: title, ru: title };
  return {
    uz: title.uz || title.ru || '',
    ru: title.ru || title.uz || '',
  };
};

/**
 * Kino shorts `musics` maydoni: musicId / videoId orqali API listlardan resolve.
 */
export function resolveShortsMusics(musicsRef, musicList = [], clipList = [], concertList = []) {
  if (!musicsRef) return null;

  if (musicsRef.music || musicsRef.img) {
    return {
      ...musicsRef,
      title: normalizeTitle(musicsRef.title),
    };
  }

  const videoPool = [
    ...(Array.isArray(clipList) ? clipList : []),
    ...(Array.isArray(concertList) ? concertList : []),
  ];

  const { musicId, videoId } = musicsRef;
  const musicItem = musicId != null
    ? (Array.isArray(musicList) ? musicList : []).find((m) => matchId(m.id, musicId))
    : null;
  const videoItem = videoId != null
    ? videoPool.find((v) => matchId(v.id, videoId))
    : null;

  if (!musicItem && !videoItem) return null;

  return {
    musicId,
    videoId,
    music: musicItem?.audio || '',
    video: videoItem?.video || '',
    img: musicItem?.img || videoItem?.img || '',
    title: normalizeTitle(musicItem?.title || videoItem?.title),
  };
}
