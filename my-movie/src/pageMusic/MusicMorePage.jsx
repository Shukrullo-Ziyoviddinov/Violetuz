import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useContentLanguage } from '../context/ContentLanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { useMusicApi } from '../context/MusicApiContext';
import MusicFilter from '../Music/MusicFilter/MusicFilter';
import '../Music/MusicFilter/MusicFilter.css';
import './MusicMorePage.css';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

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
 * Musiqa/albom/klip/konsert: categoryNameMusic orqali API dan.
 */
const SECTIONS = {
  songs: {
    categoryNameMusic: '__all__',
    titleKey: 'music.searchTypeMusic',
    titleDefault: 'Musiqa',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
    isAggregate: true,
  },
  albums: {
    categoryNameMusic: '__all_albums__',
    titleKey: 'music.searchTypeAlbum',
    titleDefault: 'Albom',
    wishlistType: 'album',
    getDetailPath: (id) => `/music/album/${id}`,
    isAggregate: true,
  },
  clips: {
    categoryNameMusic: '__all_clips__',
    titleKey: 'music.searchTypeClip',
    titleDefault: 'Klip',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
    isAggregate: true,
  },
  concerts: {
    categoryNameMusic: '__all_concerts__',
    titleKey: 'music.searchTypeConcert',
    titleDefault: 'Konsert',
    wishlistType: 'konsert',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
    isAggregate: true,
  },
  trend: {
    categoryNameMusic: 'trendMusicData',
    titleKey: 'music.trendMusic',
    titleDefault: 'Trend Musiqa',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  'top-albums': {
    categoryNameMusic: 'TopAlbums',
    titleKey: 'music.topAlbums',
    titleDefault: "Top Albomlar",
    wishlistType: 'album',
    getDetailPath: (id) => `/music/album/${id}`,
  },
  'music-drops': {
    categoryNameMusic: 'musicDropsData',
    titleKey: 'music.musicDrops',
    titleDefault: 'Music Drops',
    wishlistType: 'album',
    getDetailPath: (id) => `/music/album/${id}`,
  },
  'discover-music': {
    categoryNameMusic: 'discoverMusicData',
    titleKey: 'music.discoverMusic',
    titleDefault: 'Discover Music',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  'music-library': {
    categoryNameMusic: 'musicLibraryData',
    titleKey: 'music.musicLibrary',
    titleDefault: 'Music Library',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  'music-hub': {
    categoryNameMusic: 'musicHubData',
    titleKey: 'music.musicHub',
    titleDefault: 'Music Hub',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  'bass-music': {
    categoryNameMusic: 'bassMusicData',
    titleKey: 'music.bassMusic',
    titleDefault: 'Bass music',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  'top-nasheeds': {
    categoryNameMusic: 'topNasheedsData',
    titleKey: 'music.topNasheeds',
    titleDefault: 'Top Nashidalar',
    wishlistType: 'music',
    getDetailPath: (id) => `/music/${id}`,
  },
  artists: {
    titleKey: 'music.searchTypeArtist',
    titleDefault: 'Artistlar',
    wishlistType: 'artist',
    getDetailPath: (id) => `/music/artist/${id}`,
    isArtist: true,
    isAllArtists: true,
  },
  'sevgi-va-musiqa': {
    categoryNameMusic: 'sevgiVaMusiqaData',
    titleKey: 'music.sevgiVaMusiqa',
    titleDefault: 'Sevgi va musiqa',
    moreTo: '/music/more/sevgi-va-musiqa',
    wishlistType: 'album',
    getDetailPath: (id) => `/music/album/${id}`,
  },
  'hit-collections': {
    categoryNameMusic: 'hitCollectionsData',
    titleKey: 'music.hitCollections',
    titleDefault: "Mashhur to'plamlar",
    wishlistType: 'album',
    getDetailPath: (id) => `/music/album/${id}`,
  },
  'trend-clips': {
    categoryNameMusic: 'trendClipsData',
    titleKey: 'music.trendClips',
    titleDefault: 'Trend Kliplar',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'visual-beats': {
    categoryNameMusic: 'visualBeatsData',
    titleKey: 'music.visualBeats',
    titleDefault: 'Visual Beats',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'sevgi-va-ichq': {
    categoryNameMusic: 'loveAndDesireData',
    titleKey: 'music.sevgiVaIchq',
    titleDefault: 'Sevgi va ichq',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'trend-videos': {
    categoryNameMusic: 'trendVideosData',
    titleKey: 'music.trendVideos',
    titleDefault: 'Trenddagi kliplar',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'sahnadagi-ijod': {
    categoryNameMusic: 'stageCreationData',
    titleKey: 'music.sahnadagiIjod',
    titleDefault: 'Sahnadagi ijod',
    wishlistType: 'klip',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'live-stages': {
    categoryNameMusic: 'liveStagesData',
    titleKey: 'music.liveStages',
    titleDefault: 'Jonli sahnalar',
    wishlistType: 'konsert',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'jaxon-concerts': {
    categoryNameMusic: 'jaxonConcertsData',
    titleKey: 'music.jacksonConcerts',
    titleDefault: 'Jaxon konsertlari',
    wishlistType: 'konsert',
    getDetailPath: (id) => `/music/video/${id}`,
    isClips: true,
  },
  'stars-stage': {
    categoryNameMusic: 'starsStageData',
    titleKey: 'music.starsStage',
    titleDefault: 'Yulduzlar sahasi',
    wishlistType: 'konsert',
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
  const {
    allMusic,
    allAlbums,
    allClips,
    allConcerts,
    getMusicByCategory,
    getAlbumsByCategory,
    getClipsByCategory,
    getConcertsByCategory,
    allArtists,
    getArtistById,
  } = useMusicApi();

  const config = SECTIONS[section] || SECTIONS.trend;
  const { data: sectionData, categoryNameMusic, titleKey, titleDefault, wishlistType, getDetailPath, isAggregate } = config;

  const safeSectionData =
    config.isAllArtists
      ? allArtists.map((a) => ({ ...a, title: a.name, artist: a.description }))
      : categoryNameMusic === '__all__'
      ? allMusic
      : categoryNameMusic === '__all_albums__'
        ? allAlbums
        : categoryNameMusic === '__all_clips__'
          ? allClips
          : categoryNameMusic === '__all_concerts__'
            ? allConcerts
            : categoryNameMusic
              ? (wishlistType === 'album'
                  ? getAlbumsByCategory(categoryNameMusic)
                  : wishlistType === 'klip'
                    ? getClipsByCategory(categoryNameMusic)
                    : wishlistType === 'konsert'
                      ? getConcertsByCategory(categoryNameMusic)
                      : getMusicByCategory(categoryNameMusic))
              : ensureArray(sectionData);

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
    const artist = getArtistById(item.artistId);
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
