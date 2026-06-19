import { trendMusicData } from './trendMusicData';
import { discoverMusicData } from './discoverMusicData';
import { musicLibraryData } from './musicLibraryData';
import { musicHubData } from './musicHubData';
import { bassMusicData } from './bassMusicData';
import { topNasheedsData } from './topNasheedsData';
import { TopAlbums } from './topAlbumsData';
import { musicDropsData } from './musicDropsData';
import { sevgiVaMusiqaData } from './sevgiVaMusiqaData';
import { hitCollectionsData } from './hitCollectionsData';
import {
  MUSIC_INITIAL_COUNT,
  DISCOVER_MUSIC_INITIAL_COUNT,
  MUSIC_LIBRARY_INITIAL_COUNT,
  MUSIC_HUB_INITIAL_COUNT,
  BASS_MUSIC_INITIAL_COUNT,
  TOP_NASHEEDS_INITIAL_COUNT,
  TOP_ALBUMS_INITIAL_COUNT,
  MUSIC_DROPS_INITIAL_COUNT,
  SEVGI_VA_MUSIQA_INITIAL_COUNT,
  HIT_COLLECTIONS_INITIAL_COUNT,
} from './musicConstants';

/**
 * Musiqa bo'limlari konfiguratsiyasi.
 * Yangi bo'lim qo'shish: MUSIC_SECTIONS ga yangi obyekt qo'shing.
 * MusicMorePage.jsx SECTIONS ga ham shu id bo'yicha config qo'shing.
 *
 * Backend/database: section.data API dan kelganda massiv bo'lishi kerak.
 * MusicCards komponenti data undefined bo'lsa bo'sh massiv ishlatadi.
 */
/** Bo'limlar tartibi: 'top' - kliplardan oldin, 'between-clips' - Trend Kliplar va Jaxon konsertlari orasida, 'bottom' - kliplardan keyin */
export const MUSIC_SECTIONS = [
  {
    id: 'trend',
    position: 'top',
    data: trendMusicData,
    titleKey: 'music.trendMusic',
    titleDefault: 'Trend Musiqa',
    moreTo: '/music/more/trend',
    wishlistType: 'music',
    initialCount: MUSIC_INITIAL_COUNT,
  },
  {
    id: 'albums',
    position: 'top',
    data: TopAlbums,
    titleKey: 'music.topAlbums',
    titleDefault: 'Top Albomlar',
    moreTo: '/music/more/top-albums',
    wishlistType: 'album',
    initialCount: TOP_ALBUMS_INITIAL_COUNT,
    getDetailPath: (id) => `/music/album/${id}`,
    getArtistDisplay: (item) => item.artist || '',
  },
  {
    id: 'music-drops',
    position: 'between-clips',
    data: musicDropsData,
    titleKey: 'music.musicDrops',
    titleDefault: 'Music Drops',
    moreTo: '/music/more/music-drops',
    wishlistType: 'album',
    initialCount: MUSIC_DROPS_INITIAL_COUNT,
    getDetailPath: (id) => `/music/album/${id}`,
    getArtistDisplay: (item) => item.artist || '',
  },
  {
    id: 'discover-music',
    position: 'bottom',
    data: discoverMusicData,
    titleKey: 'music.discoverMusic',
    titleDefault: 'Discover Music',
    moreTo: '/music/more/discover-music',
    wishlistType: 'music',
    initialCount: DISCOVER_MUSIC_INITIAL_COUNT,
  },
  {
    id: 'sevgi-va-musiqa',
    position: 'bottom',
    data: sevgiVaMusiqaData,
    titleKey: 'music.sevgiVaMusiqa',
    titleDefault: 'Sevgi va musiqa',
    moreTo: '/music/more/sevgi-va-musiqa',
    wishlistType: 'album',
    initialCount: SEVGI_VA_MUSIQA_INITIAL_COUNT,
    getDetailPath: (id) => `/music/album/${id}`,
    getArtistDisplay: (item) => item.artist || '',
  },
  {
    id: 'music-library',
    position: 'bottom',
    data: musicLibraryData,
    titleKey: 'music.musicLibrary',
    titleDefault: 'Music Library',
    moreTo: '/music/more/music-library',
    wishlistType: 'music',
    initialCount: MUSIC_LIBRARY_INITIAL_COUNT,
  },
  {
    id: 'music-hub',
    position: 'bottom',
    data: musicHubData,
    titleKey: 'music.musicHub',
    titleDefault: 'Music Hub',
    moreTo: '/music/more/music-hub',
    wishlistType: 'music',
    initialCount: MUSIC_HUB_INITIAL_COUNT,
  },
  {
    id: 'hit-collections',
    position: 'bottom',
    data: hitCollectionsData,
    titleKey: 'music.hitCollections',
    titleDefault: "Mashhur to'plamlar",
    moreTo: '/music/more/hit-collections',
    wishlistType: 'album',
    initialCount: HIT_COLLECTIONS_INITIAL_COUNT,
    getDetailPath: (id) => `/music/album/${id}`,
    getArtistDisplay: (item) => item.artist || '',
  },
  {
    id: 'bass-music',
    position: 'bottom',
    data: bassMusicData,
    titleKey: 'music.bassMusic',
    titleDefault: 'Bass music',
    moreTo: '/music/more/bass-music',
    wishlistType: 'music',
    initialCount: BASS_MUSIC_INITIAL_COUNT,
  },
  {
    id: 'top-nasheeds',
    position: 'bottom',
    data: topNasheedsData,
    titleKey: 'music.topNasheeds',
    titleDefault: 'Top Nashidalar',
    moreTo: '/music/more/top-nasheeds',
    wishlistType: 'music',
    initialCount: TOP_NASHEEDS_INITIAL_COUNT,
  },
];
