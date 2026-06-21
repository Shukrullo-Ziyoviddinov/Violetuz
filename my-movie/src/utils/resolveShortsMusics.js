import { allMusicData } from '../dataMusic/allMusicData';
import { allClipsData, allConcertsData } from '../dataMusic/wishlistDataConfig';
import { matchId } from '../dataMusic/musicDataUtils';

const allVideoItems = [...(allClipsData || []), ...(allConcertsData || [])];

const normalizeTitle = (title) => {
  if (!title) return { uz: '', ru: '' };
  if (typeof title === 'string') return { uz: title, ru: title };
  return {
    uz: title.uz || title.ru || '',
    ru: title.ru || title.uz || '',
  };
};

/**
 * Kino shorts `musics` maydoni: faqat musicId / videoId beriladi,
 * audio, klip, rasm va sarlavha musiqa bo'limidan olinadi.
 */
export function resolveShortsMusics(musicsRef) {
  if (!musicsRef) return null;

  if (musicsRef.music || musicsRef.img) {
    return {
      ...musicsRef,
      title: normalizeTitle(musicsRef.title),
    };
  }

  const { musicId, videoId } = musicsRef;
  const musicItem = musicId != null
    ? allMusicData.find((m) => matchId(m.id, musicId))
    : null;
  const videoItem = videoId != null
    ? allVideoItems.find((v) => matchId(v.id, videoId))
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
