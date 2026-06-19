import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useContentLanguage } from '../context/ContentLanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { trendMusicData } from '../dataMusic/trendMusicData';
import { discoverMusicData } from '../dataMusic/discoverMusicData';
import { musicLibraryData } from '../dataMusic/musicLibraryData';
import { musicHubData } from '../dataMusic/musicHubData';
import { bassMusicData } from '../dataMusic/bassMusicData';
import { topNasheedsData } from '../dataMusic/topNasheedsData';
import { TopAlbums } from '../dataMusic/topAlbumsData';
import { musicDropsData } from '../dataMusic/musicDropsData';
import { sevgiVaMusiqaData } from '../dataMusic/sevgiVaMusiqaData';
import { hitCollectionsData } from '../dataMusic/hitCollectionsData';
import { trendClipsData } from '../dataMusic/trendClipsData';
import { jaxonConcertsData } from '../dataMusic/jaxonConcertsData';
import { visualBeatsData } from '../dataMusic/visualBeatsData';
import { loveAndDesireData } from '../dataMusic/loveAndDesireData';
import { trendVideosData } from '../dataMusic/trendVideosData';
import { stageCreationData } from '../dataMusic/stageCreationData';
import { liveStagesData } from '../dataMusic/liveStagesData';
import { starsStageData } from '../dataMusic/starsStageData';
import { artists } from '../dataMusic/artists';
import MusicFilter from '../Music/MusicFilter/MusicFilter';
import '../Music/MusicFilter/MusicFilter.css';
import './MusicMorePage.css';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

const allMusicSectionsData = [
  ...ensureArray(trendMusicData),
  ...ensureArray(discoverMusicData),
  ...ensureArray(musicLibraryData),
  ...ensureArray(musicHubData),
  ...ensureArray(bassMusicData),
  ...ensureArray(topNasheedsData),
];

const allAlbumsSectionsData = [
  ...ensureArray(TopAlbums),
  ...ensureArray(musicDropsData),
  ...ensureArray(sevgiVaMusiqaData),
  ...ensureArray(hitCollectionsData),
];

const allClipsSectionsData = [
  ...ensureArray(trendClipsData),
  ...ensureArray(visualBeatsData),
  ...ensureArray(loveAndDesireData),
  ...ensureArray(trendVideosData),
  ...ensureArray(stageCreationData),
];

const allConcertsSectionsData = [
  ...ensureArray(jaxonConcertsData),
  ...ensureArray(liveStagesData),
  ...ensureArray(starsStageData),
];

const getItemDetailPath = (item) => {
  const type = item?.type || 'music';
  if (type === 'musicAlbom' || type === 'album') return `/music/album/${item.id}`;
  if (type === 'klip' || type === 'konsert') return `/music/video/${item.id}`;
  return `/music/${item.id}`;
};

const getItemWishlistType = (item) => {
  const type = item?.type || 'music';
  if (type === 'musicAlbom' || type === 'album') return 'album';
  if (type === 'klip') return 'klip';
  if (type === 'konsert') return 'konsert';
  return 'music';
};

/**
 * Universal bo'lim konfiguratsiyasi.
 * Yangi bo'lim qo'shish: SECTIONS ga yangi key va config qo'shing.
 * Alohida sahifa YARATMASDAN, kerakli ma'lumotni shu yerda import qiling.
 */
const SECTIONS = {
  songs: {
    data: allMusicSectionsData,
    titleKey: 'music.searchTypeMusic',
    titleDefault: 'Musiqa',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
    isAggregate: true,
  },
  albums: {
    data: allAlbumsSectionsData,
    titleKey: 'music.searchTypeAlbum',
    titleDefault: 'Albom',
    wishlistType: 'album',
    getDetailPath: (id) => `/music/album/${id}`,
    isAggregate: true,
  },
  clips: {
    data: allClipsSectionsData,
    titleKey: 'music.searchTypeClip',
    titleDefault: 'Klip',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
    isAggregate: true,
  },
  concerts: {
    data: allConcertsSectionsData,
    titleKey: 'music.searchTypeConcert',
    titleDefault: 'Konsert',
    wishlistType: 'konsert',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
    isAggregate: true,
  },
  trend: {
    data: trendMusicData,
    titleKey: 'music.trendMusic',
    titleDefault: 'Trend Musiqa',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  'top-albums': {
    data: TopAlbums,
    titleKey: 'music.topAlbums',
    titleDefault: "Top Albomlar",
    wishlistType: 'album',
    getDetailPath: (id) => `/music/album/${id}`,
  },
  'music-drops': {
    data: musicDropsData,
    titleKey: 'music.musicDrops',
    titleDefault: 'Music Drops',
    wishlistType: 'album',
    getDetailPath: (id) => `/music/album/${id}`,
  },
  'discover-music': {
    data: discoverMusicData,
    titleKey: 'music.discoverMusic',
    titleDefault: 'Discover Music',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  'music-library': {
    data: musicLibraryData,
    titleKey: 'music.musicLibrary',
    titleDefault: 'Music Library',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  'music-hub': {
    data: musicHubData,
    titleKey: 'music.musicHub',
    titleDefault: 'Music Hub',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  'bass-music': {
    data: bassMusicData,
    titleKey: 'music.bassMusic',
    titleDefault: 'Bass music',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  'top-nasheeds': {
    data: topNasheedsData,
    titleKey: 'music.topNasheeds',
    titleDefault: 'Top Nashidalar',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  artists: {
    data: artists.map((a) => ({ ...a, title: a.name, artist: a.description })),
    titleKey: 'music.searchTypeArtist',
    titleDefault: 'Artistlar',
    wishlistType: 'artist',
    getDetailPath: (id) => `/music/artist/${id}`,
    isArtist: true,
  },
  'sevgi-va-musiqa': {
    data: sevgiVaMusiqaData,
    titleKey: 'music.sevgiVaMusiqa',
    titleDefault: 'Sevgi va musiqa',
    wishlistType: 'album',
    getDetailPath: (id) => `/music/album/${id}`,
  },
  'hit-collections': {
    data: hitCollectionsData,
    titleKey: 'music.hitCollections',
    titleDefault: "Mashhur to'plamlar",
    wishlistType: 'album',
    getDetailPath: (id) => `/music/album/${id}`,
  },
  'trend-clips': {
    data: trendClipsData,
    titleKey: 'music.trendClips',
    titleDefault: 'Trend Kliplar',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'jaxon-concerts': {
    data: jaxonConcertsData,
    titleKey: 'music.jacksonConcerts',
    titleDefault: 'Jaxon konsertlari',
    wishlistType: 'konsert',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'live-stages': {
    data: liveStagesData,
    titleKey: 'music.liveStages',
    titleDefault: 'Jonli sahnalar',
    wishlistType: 'konsert',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'stars-stage': {
    data: starsStageData,
    titleKey: 'music.starsStage',
    titleDefault: 'Yulduzlar sahasi',
    wishlistType: 'konsert',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'visual-beats': {
    data: visualBeatsData,
    titleKey: 'music.visualBeats',
    titleDefault: 'Visual Beats',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'sevgi-va-ichq': {
    data: loveAndDesireData,
    titleKey: 'music.sevgiVaIchq',
    titleDefault: 'Sevgi va ichq',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'trend-videos': {
    data: trendVideosData,
    titleKey: 'music.trendVideos',
    titleDefault: 'Trenddagi kliplar',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'sahnadagi-ijod': {
    data: stageCreationData,
    titleKey: 'music.sahnadagiIjod',
    titleDefault: 'Sahnadagi ijod',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
};

const MusicMorePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { section = 'trend' } = useParams();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const config = SECTIONS[section] || SECTIONS.trend;
  const { data: sectionData, titleKey, titleDefault, wishlistType, getDetailPath, isAggregate } = config;
  const safeSectionData = Array.isArray(sectionData) ? sectionData : [];

  const [filteredItems, setFilteredItems] = useState(safeSectionData);
  const allItems = filteredItems;

  useEffect(() => {
    setFilteredItems(safeSectionData);
  }, [section, safeSectionData]);

  const resolveDetailPath = (item) => (isAggregate ? getItemDetailPath(item) : getDetailPath(item.id));
  const resolveWishlistType = (item) => (isAggregate ? getItemWishlistType(item) : wishlistType);

  const getTitle = (item) => {
    if (!item?.title) return '';
    if (typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
    }
    return String(item.title);
  };

  const getArtistDisplay = (item) => {
    if (item.artist) return item.artist;
    const artist = artists.find((a) => a.id === item.artistId);
    return artist?.name || item.artistId || '';
  };

  const handleCardClick = (item) => {
    const path = resolveDetailPath(item);
    navigate(`${path}?section=${encodeURIComponent(section)}`, { replace: false });
  };

  const handleWishlistClick = (e, item) => {
    e.stopPropagation();
    const wType = resolveWishlistType(item);
    toggleWishlist(item.id, wType);
  };

  const isClips = config.isClips === true;
  const isArtist = config.isArtist === true;

  return (
    <div className={`music-more-page ${isClips ? 'music-more-page--clips' : ''} ${isArtist ? 'music-more-page--artists' : ''}`}>
      <div className="music-more-page-container">
        <div className="music-more-page-header">
          <button
            type="button"
            className="music-more-page-back"
            onClick={() => navigate('/music')}
            aria-label="Orqaga"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 className="music-more-page-title">{t(titleKey, titleDefault)}</h1>
        </div>
        <MusicFilter data={safeSectionData} onFilteredChange={setFilteredItems} />
        <div className="music-more-page-grid">
          {allItems.map((item) => (
            <div
              key={`${resolveWishlistType(item)}-${item.id}`}
              className="music-more-page-item"
              onClick={() => handleCardClick(item)}
            >
              <div className="music-more-page-item-image-wrapper">
                <img
                  src={item.img || item.imgArtist || '/img/movie1.jpg'}
                  alt={getTitle(item)}
                  className="music-more-page-item-image"
                />
                {!isArtist && (
                  <>
                    <button
                      className={`music-more-page-item-wishlist-btn ${isInWishlist(item.id, resolveWishlistType(item)) ? 'active' : ''}`}
                      onClick={(e) => handleWishlistClick(e, item)}
                      aria-label="Sevimlilarga qo'shish"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(item.id, resolveWishlistType(item)) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <div className="music-more-page-item-play">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </>
                )}
                {!isArtist && (
                  <div className="music-more-page-item-info">
                    <h3 className="music-more-page-item-title">{getTitle(item)}</h3>
                    <p className="music-more-page-item-artist">{getArtistDisplay(item)}</p>
                  </div>
                )}
              </div>
              {isArtist && (
                <div className="music-more-page-item-info">
                  <h3 className="music-more-page-item-title">{getTitle(item)}</h3>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MusicMorePage;
