/**
 * Wishlist sahifasi uchun ma'lumot manbalari.
 * Albomlar endi API/DB dan (useMusicApi().allAlbums).
 * Klip/konsert keyingi bosqichda DB ga o'tkaziladi.
 */
import { jaxonConcertsData } from './jaxonConcertsData';
import { liveStagesData } from './liveStagesData';
import { starsStageData } from './starsStageData';
import { trendClipsData } from './trendClipsData';
import { visualBeatsData } from './visualBeatsData';
import { loveAndDesireData } from './loveAndDesireData';
import { trendVideosData } from './trendVideosData';
import { stageCreationData } from './stageCreationData';

/** Barcha konsert ma'lumotlari - yangi konsert bo'limi qo'shilganda shu yerga qo'shing */
export const allConcertsData = [
  ...(jaxonConcertsData || []),
  ...(liveStagesData || []),
  ...(starsStageData || []),
];

/** Barcha klip ma'lumotlari - yangi klip bo'limi qo'shilganda shu yerga qo'shing */
export const allClipsData = [
  ...(trendClipsData || []),
  ...(visualBeatsData || []),
  ...(loveAndDesireData || []),
  ...(trendVideosData || []),
  ...(stageCreationData || []),
];
