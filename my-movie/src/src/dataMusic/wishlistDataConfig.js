/**
 * Wishlist sahifasi uchun ma'lumot manbalari.
 * Yangi bo'lim qo'shilganda tegishli massivga qo'shing:
 * - allConcertsData: wishlistType: 'konsert' bo'lgan barcha konsert bo'limlari
 * - allClipsData: wishlistType: 'klip' bo'lgan barcha klip bo'limlari
 * - allAlbums: wishlistType: 'album' bo'lgan barcha albom bo'limlari
 */
import { jaxonConcertsData } from './jaxonConcertsData';
import { liveStagesData } from './liveStagesData';
import { starsStageData } from './starsStageData';
import { trendClipsData } from './trendClipsData';
import { visualBeatsData } from './visualBeatsData';
import { loveAndDesireData } from './loveAndDesireData';
import { trendVideosData } from './trendVideosData';
import { stageCreationData } from './stageCreationData';
import { TopAlbums } from './topAlbumsData';
import { musicDropsData } from './musicDropsData';
import { sevgiVaMusiqaData } from './sevgiVaMusiqaData';
import { hitCollectionsData } from './hitCollectionsData';

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

/** Barcha albom ma'lumotlari - yangi albom bo'limi qo'shilganda shu yerga qo'shing */
export const allAlbums = [
  ...(TopAlbums || []),
  ...(musicDropsData || []),
  ...(sevgiVaMusiqaData || []),
  ...(hitCollectionsData || []),
];
