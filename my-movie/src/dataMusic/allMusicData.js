/**
 * Barcha musiqa ma'lumotlari birlashtirilgan.
 * MusicDetail, MusicPlayerContext, Search, Wishlist va boshqalar uchun.
 * Backend: API dan kelganda har bir massiv null bo'lishi mumkin – guard qo'shilgan.
 */
import { trendMusicData } from './trendMusicData';
import { discoverMusicData } from './discoverMusicData';
import { musicLibraryData } from './musicLibraryData';
import { musicHubData } from './musicHubData';
import { bassMusicData } from './bassMusicData';
import { topNasheedsData } from './topNasheedsData';

export const allMusicData = [
  ...(trendMusicData || []),
  ...(discoverMusicData || []),
  ...(musicLibraryData || []),
  ...(musicHubData || []),
  ...(bassMusicData || []),
  ...(topNasheedsData || []),
];
