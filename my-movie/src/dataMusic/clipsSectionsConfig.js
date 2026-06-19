import { trendClipsData } from './trendClipsData';
import { jaxonConcertsData } from './jaxonConcertsData';
import { visualBeatsData } from './visualBeatsData';
import { loveAndDesireData } from './loveAndDesireData';
import { TREND_CLIPS_INITIAL_COUNT, JAXON_CONCERTS_INITIAL_COUNT, VISUAL_BEATS_INITIAL_COUNT, SEVGI_VA_ICHQ_INITIAL_COUNT, TREND_VIDEOS_INITIAL_COUNT, STAGE_CREATION_INITIAL_COUNT, LIVE_STAGES_INITIAL_COUNT, STARS_STAGE_INITIAL_COUNT } from './musicConstants';
import { trendVideosData } from './trendVideosData';
import { stageCreationData } from './stageCreationData';
import { liveStagesData } from './liveStagesData';
import { starsStageData } from './starsStageData';

/**
 * Videoli klip bo'limlari konfiguratsiyasi.
 * Yangi bo'lim qo'shish: CLIPS_SECTIONS ga yangi obyekt qo'shing.
 * Eslatma: MusicMorePage.jsx SECTIONS ga ham shu id bo'yicha config qo'shing.
 *
 * Backend/database: section.data API dan kelganda massiv bo'lishi kerak.
 * MusicCards/ClipsCards komponentlari data undefined bo'lsa bo'sh massiv ishlatadi.
 */
export const CLIPS_SECTIONS = [
  {
    id: 'trend-clips',
    data: trendClipsData,
    titleKey: 'music.trendClips',
    titleDefault: 'Trend Kliplar',
    moreTo: '/music/more/trend-clips',
    wishlistType: 'klip',
    initialCount: TREND_CLIPS_INITIAL_COUNT,
  },
  {
    id: 'jaxon-concerts',
    data: jaxonConcertsData,
    titleKey: 'music.jacksonConcerts',
    titleDefault: 'Jaxon konsertlari',
    moreTo: '/music/more/jaxon-concerts',
    wishlistType: 'konsert',
    initialCount: JAXON_CONCERTS_INITIAL_COUNT,
  },
  {
    id: 'live-stages',
    data: liveStagesData,
    titleKey: 'music.liveStages',
    titleDefault: 'Jonli sahnalar',
    moreTo: '/music/more/live-stages',
    wishlistType: 'konsert',
    initialCount: LIVE_STAGES_INITIAL_COUNT,
  },
  {
    id: 'stars-stage',
    data: starsStageData,
    titleKey: 'music.starsStage',
    titleDefault: 'Yulduzlar sahasi',
    moreTo: '/music/more/stars-stage',
    wishlistType: 'konsert',
    initialCount: STARS_STAGE_INITIAL_COUNT,
  },
  {
    id: 'visual-beats',
    data: visualBeatsData,
    titleKey: 'music.visualBeats',
    titleDefault: 'Visual Beats',
    moreTo: '/music/more/visual-beats',
    wishlistType: 'klip',
    initialCount: VISUAL_BEATS_INITIAL_COUNT,
  },
  {
    id: 'sevgi-va-ichq',
    data: loveAndDesireData,
    titleKey: 'music.sevgiVaIchq',
    titleDefault: 'Sevgi va ichq',
    moreTo: '/music/more/sevgi-va-ichq',
    wishlistType: 'klip',
    initialCount: SEVGI_VA_ICHQ_INITIAL_COUNT,
  },
  {
    id: 'trend-videos',
    data: trendVideosData,
    titleKey: 'music.trendVideos',
    titleDefault: 'Trenddagi kliplar',
    moreTo: '/music/more/trend-videos',
    wishlistType: 'klip',
    initialCount: TREND_VIDEOS_INITIAL_COUNT,
  },
  {
    id: 'sahnadagi-ijod',
    data: stageCreationData,
    titleKey: 'music.sahnadagiIjod',
    titleDefault: 'Sahnadagi ijod',
    moreTo: '/music/more/sahnadagi-ijod',
    wishlistType: 'klip',
    initialCount: STAGE_CREATION_INITIAL_COUNT,
  },
  // Yangi bo'lim qo'shish:
  // 1. Data faylini yarating (masalan: popularClipsData.js)
  // 2. CLIPS_SECTIONS ga obyekt qo'shing
  // 3. MusicMorePage.jsx SECTIONS ga 'section-id': { data, titleKey, wishlistType: 'klip', getDetailPath }
];
