import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useContentLanguage } from '../context/ContentLanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { useMusicApi } from '../context/MusicApiContext';
import MusicFilter from '../Music/MusicFilter/MusicFilter';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../utils/useImageReady';
import '../Music/MusicFilter/MusicFilter.css';
import './MusicMorePage.css';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);
const SKELETON_COUNT = 12;

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

const MusicMoreItemSkeleton = ({ isArtist }) => (
  <div className="music-more-page-item music-more-page-item--skeleton" aria-hidden="true">
    <div className="music-more-page-item-image-wrapper">
      <SkeletonLoader
        variant="music-more-page-image"
        className="music-more-page-item-image-skeleton"
      />
      {!isArtist && (
        <>
          <span
            className="music-more-page-item-wishlist-btn music-more-page-item-wishlist-btn--skeleton"
            aria-hidden="true"
          />
          <span
            className="music-more-page-item-play music-more-page-item-play--skeleton"
            aria-hidden="true"
          />
          <div className="music-more-page-item-info">
            <SkeletonLoader variant="music-more-page-item-title" />
            <SkeletonLoader variant="music-more-page-item-artist" />
          </div>
        </>
      )}
    </div>
    {isArtist && (
      <div className="music-more-page-item-info">
        <SkeletonLoader variant="music-more-page-item-title" />
      </div>
    )}
  </div>
);

const MusicMoreItem = ({
  item,
  isArtist,
  getTitle,
  getArtistDisplay,
  isInWishlist,
  resolveWishlistType,
  onCardClick,
  onWishlistClick,
  blockClick,
}) => {
  const imgSrc = item.img || item.imgArtist || '/img/movie1.jpg';
  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError } = useImageReady(imgSrc);
  const wType = resolveWishlistType(item);
  const inWishlist = isInWishlist(item.id, wType);

  return (
    <div
      className={`music-more-page-item${showImgSkeleton ? ' music-more-page-item--loading' : ''}`}
      onClick={() => !blockClick && !showImgSkeleton && onCardClick(item)}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="music-more-page-item-image-wrapper">
        {showImgSkeleton && (
          <SkeletonLoader
            variant="music-more-page-image"
            className="music-more-page-item-image-skeleton"
          />
        )}
        {imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={getTitle(item)}
            className={`music-more-page-item-image${
              showImgSkeleton ? ' music-more-page-item-image--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
        {!isArtist && (
          <>
            {showImgSkeleton ? (
              <>
                <span
                  className="music-more-page-item-wishlist-btn music-more-page-item-wishlist-btn--skeleton"
                  aria-hidden="true"
                />
                <span
                  className="music-more-page-item-play music-more-page-item-play--skeleton"
                  aria-hidden="true"
                />
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`music-more-page-item-wishlist-btn ${inWishlist ? 'active' : ''}`}
                  onClick={(e) => onWishlistClick(e, item)}
                  aria-label="Sevimlilarga qo'shish"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={inWishlist ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
            <div className="music-more-page-item-info">
              {showImgSkeleton ? (
                <>
                  <SkeletonLoader variant="music-more-page-item-title" />
                  <SkeletonLoader variant="music-more-page-item-artist" />
                </>
              ) : (
                <>
                  <h3 className="music-more-page-item-title">{getTitle(item)}</h3>
                  <p className="music-more-page-item-artist">{getArtistDisplay(item)}</p>
                </>
              )}
            </div>
          </>
        )}
      </div>
      {isArtist && (
        <div className="music-more-page-item-info">
          {showImgSkeleton ? (
            <SkeletonLoader variant="music-more-page-item-title" />
          ) : (
            <h3 className="music-more-page-item-title">{getTitle(item)}</h3>
          )}
        </div>
      )}
    </div>
  );
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
    musicLoading,
    albumsLoading,
    clipsLoading,
    concertsLoading,
    artistsLoading,
  } = useMusicApi();

  const config = SECTIONS[section] || SECTIONS.trend;
  const {
    data: sectionData,
    categoryNameMusic,
    titleKey,
    titleDefault,
    wishlistType,
    getDetailPath,
    isAggregate,
  } = config;

  const catalogLoading = useMemo(() => {
    if (config.isAllArtists) return Boolean(artistsLoading);
    if (categoryNameMusic === '__all__') return Boolean(musicLoading);
    if (categoryNameMusic === '__all_albums__') return Boolean(albumsLoading);
    if (categoryNameMusic === '__all_clips__') return Boolean(clipsLoading);
    if (categoryNameMusic === '__all_concerts__') return Boolean(concertsLoading);
    if (wishlistType === 'album') return Boolean(albumsLoading);
    if (wishlistType === 'klip') return Boolean(clipsLoading);
    if (wishlistType === 'konsert') return Boolean(concertsLoading);
    if (wishlistType === 'artist') return Boolean(artistsLoading);
    return Boolean(musicLoading);
  }, [
    config.isAllArtists,
    categoryNameMusic,
    wishlistType,
    musicLoading,
    albumsLoading,
    clipsLoading,
    concertsLoading,
    artistsLoading,
  ]);

  const safeSectionData = config.isAllArtists
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
              ? wishlistType === 'album'
                ? getAlbumsByCategory(categoryNameMusic)
                : wishlistType === 'klip'
                  ? getClipsByCategory(categoryNameMusic)
                  : wishlistType === 'konsert'
                    ? getConcertsByCategory(categoryNameMusic)
                    : getMusicByCategory(categoryNameMusic)
              : ensureArray(sectionData);

  const [filteredItems, setFilteredItems] = useState(safeSectionData);
  const allItems = filteredItems;

  useEffect(() => {
    setFilteredItems(safeSectionData);
  }, [section, safeSectionData]);

  const showPageSkeleton = Boolean(catalogLoading) && safeSectionData.length === 0;
  const skeletonItems = useMemo(
    () =>
      Array.from({ length: SKELETON_COUNT }, (_, i) => ({
        id: `music-more-skel-${i}`,
      })),
    []
  );

  const resolveDetailPath = (item) =>
    isAggregate ? getItemDetailPath(item) : getDetailPath(item.id);
  const resolveWishlistType = (item) =>
    isAggregate ? getItemWishlistType(item) : wishlistType;

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
    <div
      className={`music-more-page ${isClips ? 'music-more-page--clips' : ''} ${isArtist ? 'music-more-page--artists' : ''}`}
      aria-busy={showPageSkeleton || undefined}
    >
      <div className="music-more-page-container">
        <div
          className={`music-more-page-header${showPageSkeleton ? ' music-more-page-header--skeleton' : ''}`}
        >
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
          {showPageSkeleton ? (
            <SkeletonLoader
              variant="music-more-page-title"
              className="music-more-page-title-skeleton"
            />
          ) : (
            <h1 className="music-more-page-title">{t(titleKey, titleDefault)}</h1>
          )}
        </div>

        <MusicFilter
          data={safeSectionData}
          onFilteredChange={setFilteredItems}
          forceSkeleton={showPageSkeleton}
        />

        <div className="music-more-page-grid">
          {showPageSkeleton
            ? skeletonItems.map((item) => (
                <MusicMoreItemSkeleton key={item.id} isArtist={isArtist} />
              ))
            : allItems.map((item) => (
                <MusicMoreItem
                  key={`${resolveWishlistType(item)}-${item.id}`}
                  item={item}
                  isArtist={isArtist}
                  getTitle={getTitle}
                  getArtistDisplay={getArtistDisplay}
                  isInWishlist={isInWishlist}
                  resolveWishlistType={resolveWishlistType}
                  onCardClick={handleCardClick}
                  onWishlistClick={handleWishlistClick}
                  blockClick={catalogLoading}
                />
              ))}
        </div>
      </div>
    </div>
  );
};

export default MusicMorePage;
