/** Search natijalari filter turlari — bitta manba */

export const SEARCH_FILTER_ALL = 'all';

export const SEARCH_FILTER_TYPES = [
  {
    id: 'movie',
    resultKey: 'movies',
    labelKey: 'searchModal.filterMovie',
    labelDefault: 'Kino',
  },
  {
    id: 'music',
    resultKey: 'music',
    labelKey: 'searchModal.filterMusic',
    labelDefault: 'Musiqa',
  },
  {
    id: 'klip',
    resultKey: 'clips',
    labelKey: 'searchModal.filterClip',
    labelDefault: 'Klip',
  },
  {
    id: 'konsert',
    resultKey: 'concerts',
    labelKey: 'searchModal.filterConcert',
    labelDefault: 'Konsert',
  },
  {
    id: 'album',
    resultKey: 'albums',
    labelKey: 'searchModal.filterAlbum',
    labelDefault: 'Albom',
  },
  {
    id: 'actor',
    resultKey: 'actors',
    labelKey: 'searchModal.filterActors',
    labelDefault: 'Aktyorlar',
  },
  {
    id: 'artist',
    resultKey: 'musicArtists',
    labelKey: 'searchModal.filterMusicArtists',
    labelDefault: 'Musiqachilar',
  },
];

/** Natijada mavjud bo'lgan filterlarni qaytaradi */
export const getAvailableSearchFilters = (results = {}) =>
  SEARCH_FILTER_TYPES.filter(({ resultKey }) => (results[resultKey]?.length ?? 0) > 0);

/** Tanlangan filter bo'yicha bo'lim ko'rinishini tekshiradi */
export const isSearchSectionVisible = (activeFilter, sectionId) =>
  activeFilter === SEARCH_FILTER_ALL || activeFilter === sectionId;
