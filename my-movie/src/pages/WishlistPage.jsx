import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useWishlist } from '../context/WishlistContext';
import { useContentLanguage } from '../context/ContentLanguageContext';
import { useMoviesApi } from '../context/MoviesApiContext';
import { useMusicApi } from '../context/MusicApiContext';
import { fetchAllTrillers } from '../api/trillersApi';
import { getLocalizedField } from '../utils/shortsMovieUtils';
import Movies from '../components/Movies/Movies';
import ScrollTouch from '../components/ScrollTouch/ScrollTouch';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import {
  WishlistFilterModal,
  WishlistTabIcons,
  createEmptyDrafts,
  cloneDrafts,
  applyWishlistTabFilters,
} from '../components/WishlistPageFilter';
import { useImageReady } from '../utils/useImageReady';
import './WishlistPage.css';
import '../components/WishlistPageFilter/WishlistFilterModal.css';
import '../components/Filters/FiltersSelect.css';

const EMPTY_IMG_SRC = '/img/wishlist_preview_rev_1.png';
const MOBILE_MAX = 768;

const useIsMobileWishlist = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
};

const WishlistEmptySkeleton = () => (
  <div className="wishlist-page wishlist-page--empty">
    <div className="wishlist-empty" aria-busy="true">
      <div className="wishlist-empty-img wishlist-empty-img--skeleton" aria-hidden="true">
        <SkeletonLoader variant="wishlist-empty-img" />
      </div>
      <div className="wishlist-empty-text wishlist-empty-text--skeleton" aria-hidden="true">
        <SkeletonLoader variant="wishlist-empty-text" />
      </div>
      <div className="wishlist-empty-btn wishlist-empty-btn--skeleton" aria-hidden="true">
        <SkeletonLoader variant="wishlist-empty-btn" />
      </div>
    </div>
  </div>
);

const WishlistEmpty = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError } = useImageReady(EMPTY_IMG_SRC);

  if (showImgSkeleton) {
    return <WishlistEmptySkeleton />;
  }

  return (
    <div className="wishlist-page wishlist-page--empty">
      <div className="wishlist-empty">
        <img
          ref={imgRef}
          src={EMPTY_IMG_SRC}
          alt={t('wishlist.emptyText')}
          className="wishlist-empty-img"
          decoding="async"
          onLoad={onLoad}
          onError={onError}
        />
        <p className="wishlist-empty-text">
          {t('wishlist.emptyText')}
        </p>
        <button
          type="button"
          className="wishlist-empty-btn"
          onClick={() => navigate('/')}
        >
          {t('wishlist.goToHome')}
        </button>
      </div>
    </div>
  );
};

const WishlistPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobileWishlist();
  const { contentLang } = useContentLanguage();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { allMovies: apiMovies, moviesLoading } = useMoviesApi();
  const {
    allMusic,
    allAlbums,
    allClips,
    allConcerts,
    getArtistById,
    musicLoading,
    albumsLoading,
    clipsLoading,
    concertsLoading,
  } = useMusicApi();
  const { data: allTrillers = [], isPending: trillersLoading } = useQuery({
    queryKey: ['trillers', 'with-description'],
    queryFn: fetchAllTrillers,
  });
  const [activeTab, setActiveTab] = useState('movie');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [draftTab, setDraftTab] = useState('movie');
  const [appliedFilters, setAppliedFilters] = useState(() => createEmptyDrafts());
  const [draftFilters, setDraftFilters] = useState(() => createEmptyDrafts());

  const wishlistCatalogLoading =
    moviesLoading ||
    musicLoading ||
    albumsLoading ||
    clipsLoading ||
    concertsLoading ||
    trillersLoading;

  const normalizeType = (raw) => {
    const v = String(raw || '').toLowerCase();
    if (v === 'movie') return 'movie';
    if (v === 'music') return 'music';
    if (v === 'album') return 'album';
    if (v === 'klip' || v === 'clip') return 'klip';
    if (v === 'konsert' || v === 'concert') return 'konsert';
    if (v === 'triller' || v === 'trailer') return 'triller';
    return '';
  };

  const matchWishlist = (itemId, type) =>
    wishlistItems.some((x) => x.id == itemId && normalizeType(x.type) === normalizeType(type));

  const moviesSource = apiMovies?.length ? apiMovies : [];
  const wishlistMovies = moviesSource.filter((m) => matchWishlist(m.id, normalizeType(m.type) || 'movie'));
  const wishlistAlbums = allAlbums.filter((a) => matchWishlist(a.id, 'album'));
  const wishlistMusic = allMusic.filter((m) => matchWishlist(m.id, 'music'));
  const wishlistClips = allClips.filter((c) => matchWishlist(c.id, normalizeType(c.type) || 'klip'));
  const wishlistConcerts = allConcerts.filter((c) => matchWishlist(c.id, normalizeType(c.type) || 'konsert'));
  const wishlistTrillers = allTrillers.filter((item) => matchWishlist(item.id, 'triller'));

  const hasMovies = wishlistMovies.length > 0;
  const hasMusic = wishlistMusic.length > 0;
  const hasAlbums = wishlistAlbums.length > 0;
  const hasClips = wishlistClips.length > 0;
  const hasConcerts = wishlistConcerts.length > 0;
  const hasTrillers = wishlistTrillers.length > 0;
  const isEmpty =
    !hasMovies && !hasMusic && !hasAlbums && !hasClips && !hasConcerts && !hasTrillers;
  const showTabs =
    (hasMovies ? 1 : 0) +
      (hasMusic ? 1 : 0) +
      (hasAlbums ? 1 : 0) +
      (hasClips ? 1 : 0) +
      (hasConcerts ? 1 : 0) +
      (hasTrillers ? 1 : 0) >=
    2;

  const getDefaultTab = () => {
    if (hasMovies) return 'movie';
    if (hasMusic) return 'music';
    if (hasAlbums) return 'album';
    if (hasClips) return 'klip';
    if (hasConcerts) return 'konsert';
    if (hasTrillers) return 'triller';
    return 'movie';
  };

  const getMusicTitle = (item) => {
    if (!item?.title) return '';
    if (typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
    }
    return String(item.title);
  };

  const getArtistName = (artistId) => {
    const artist = getArtistById(artistId);
    return artist?.name || artistId || '';
  };

  const handleMusicWishlistClick = (e, id) => {
    e.stopPropagation();
    toggleWishlist(id, 'music');
  };

  const handleAlbumWishlistClick = (e, id) => {
    e.stopPropagation();
    toggleWishlist(id, 'album');
  };

  const handleClipWishlistClick = (e, id, type) => {
    e.stopPropagation();
    toggleWishlist(id, normalizeType(type) || 'klip');
  };

  const handleTrillerWishlistClick = (e, id) => {
    e.stopPropagation();
    toggleWishlist(id, 'triller');
  };

  if (isEmpty) {
    if (wishlistCatalogLoading) {
      return <WishlistEmptySkeleton />;
    }
    return <WishlistEmpty />;
  }

  const tabIsValid =
    (activeTab === 'movie' && hasMovies) ||
    (activeTab === 'music' && hasMusic) ||
    (activeTab === 'album' && hasAlbums) ||
    (activeTab === 'klip' && hasClips) ||
    (activeTab === 'konsert' && hasConcerts) ||
    (activeTab === 'triller' && hasTrillers);

  const effectiveTab = showTabs
    ? tabIsValid
      ? activeTab
      : getDefaultTab()
    : hasMovies
      ? 'movie'
      : hasMusic
        ? 'music'
        : hasAlbums
          ? 'album'
          : hasClips
            ? 'klip'
            : hasConcerts
              ? 'konsert'
              : 'triller';

  const availableTabs = [];
  if (hasMovies) {
    availableTabs.push({ id: 'movie', label: t('wishlist.tabMovies', 'Kino') });
  }
  if (hasMusic) {
    availableTabs.push({ id: 'music', label: t('wishlist.tabMusic', 'Musiqa') });
  }
  if (hasAlbums) {
    availableTabs.push({ id: 'album', label: t('wishlist.tabAlbums', 'Albom') });
  }
  if (hasClips) {
    availableTabs.push({ id: 'klip', label: t('wishlist.tabClips', 'Klip') });
  }
  if (hasConcerts) {
    availableTabs.push({
      id: 'konsert',
      label: t('wishlist.tabKonserts', 'Konsert'),
    });
  }
  if (hasTrillers) {
    availableTabs.push({
      id: 'triller',
      label: t('wishlist.tabTriller', 'Triller'),
    });
  }

  const openFilterModal = () => {
    setDraftTab(effectiveTab);
    setDraftFilters(cloneDrafts(appliedFilters));
    setFilterModalOpen(true);
  };

  const handleFilterApply = () => {
    setActiveTab(draftTab);
    setAppliedFilters(cloneDrafts(draftFilters));
    setFilterModalOpen(false);
  };

  const filterCatalogs = {
    movie: wishlistMovies,
    music: wishlistMusic,
    album: wishlistAlbums,
    klip: wishlistClips,
    konsert: wishlistConcerts,
    triller: wishlistTrillers,
  };

  const visibleMovies = applyWishlistTabFilters(
    'movie',
    wishlistMovies,
    appliedFilters
  );
  const visibleMusic = applyWishlistTabFilters(
    'music',
    wishlistMusic,
    appliedFilters
  );
  const visibleAlbums = applyWishlistTabFilters(
    'album',
    wishlistAlbums,
    appliedFilters
  );
  const visibleClips = applyWishlistTabFilters(
    'klip',
    wishlistClips,
    appliedFilters
  );
  const visibleConcerts = applyWishlistTabFilters(
    'konsert',
    wishlistConcerts,
    appliedFilters
  );

  return (
    <div className="wishlist-page">
      {showTabs && (
        <>
          <ScrollTouch className="wishlist-tabs wishlist-tabs--desktop">
            {hasMovies && (
              <button
                type="button"
                className={`wishlist-tab ${effectiveTab === 'movie' ? 'active' : ''}`}
                onClick={() => setActiveTab('movie')}
              >
                <span className="wishlist-tab-icon">{WishlistTabIcons.movie}</span>
                {t('wishlist.tabMovies', 'Kino')}
              </button>
            )}
            {hasMusic && (
              <button
                type="button"
                className={`wishlist-tab ${effectiveTab === 'music' ? 'active' : ''}`}
                onClick={() => setActiveTab('music')}
              >
                <span className="wishlist-tab-icon">{WishlistTabIcons.music}</span>
                {t('wishlist.tabMusic', 'Musiqa')}
              </button>
            )}
            {hasAlbums && (
              <button
                type="button"
                className={`wishlist-tab ${effectiveTab === 'album' ? 'active' : ''}`}
                onClick={() => setActiveTab('album')}
              >
                <span className="wishlist-tab-icon">{WishlistTabIcons.album}</span>
                {t('wishlist.tabAlbums', 'Albom')}
              </button>
            )}
            {hasClips && (
              <button
                type="button"
                className={`wishlist-tab ${effectiveTab === 'klip' ? 'active' : ''}`}
                onClick={() => setActiveTab('klip')}
              >
                <span className="wishlist-tab-icon">{WishlistTabIcons.klip}</span>
                {t('wishlist.tabClips', 'Klip')}
              </button>
            )}
            {hasConcerts && (
              <button
                type="button"
                className={`wishlist-tab ${effectiveTab === 'konsert' ? 'active' : ''}`}
                onClick={() => setActiveTab('konsert')}
              >
                <span className="wishlist-tab-icon">{WishlistTabIcons.konsert}</span>
                {t('wishlist.tabKonserts', 'Konsert')}
              </button>
            )}
            {hasTrillers && (
              <button
                type="button"
                className={`wishlist-tab ${effectiveTab === 'triller' ? 'active' : ''}`}
                onClick={() => setActiveTab('triller')}
              >
                <span className="wishlist-tab-icon">{WishlistTabIcons.triller}</span>
                {t('wishlist.tabTriller', 'Triller')}
              </button>
            )}
          </ScrollTouch>

          <button
            type="button"
            className="wishlist-filter-mobile-bar"
            onClick={openFilterModal}
          >
            <span className="wishlist-filter-mobile-bar-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 5h16" />
                <path d="M7 12h10" />
                <path d="M10 19h4" />
              </svg>
            </span>
            <span className="wishlist-filter-mobile-bar-text">
              {t('wishlist.sortAndFilter', 'Saralash va filterlash')}
            </span>
          </button>

          {isMobile ? (
            <WishlistFilterModal
              isOpen={filterModalOpen}
              onClose={() => setFilterModalOpen(false)}
              tabs={availableTabs}
              selectedTab={draftTab}
              onSelectTab={setDraftTab}
              drafts={draftFilters}
              onDraftsChange={setDraftFilters}
              catalogs={filterCatalogs}
              onApply={handleFilterApply}
            />
          ) : null}
        </>
      )}

      {effectiveTab === 'movie' && (
        <Movies
          sectionType="wishlist"
          limit={null}
          filteredMovies={visibleMovies}
          hideHeader
          isLoading={false}
        />
      )}

      {effectiveTab === 'album' && (
        <div className="wishlist-music">
          <div className="wishlist-music-container">
            <div className="wishlist-music-grid">
                {visibleAlbums.map((album) => (
                  <div
                    key={`album-${album.id}`}
                    className="wishlist-music-item"
                    onClick={() => navigate(`/music/album/${album.id}`)}
                  >
                    <div className="wishlist-music-item-image-wrapper">
                      <img
                        src={album.img || '/img/movie1.jpg'}
                        alt={album.title}
                        className="wishlist-music-item-image"
                      />
                      <button
                        className="wishlist-music-item-wishlist-btn active"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(album.id, 'album');
                        }}
                        aria-label="Sevimlilardan olib tashlash"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="wishlist-music-item-info">
                      <h3 className="wishlist-music-item-title">{album.title}</h3>
                      <p className="wishlist-music-item-artist">{album.artist}</p>
                    </div>
                    <div className="wishlist-music-item-play">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {effectiveTab === 'music' && (
        <div className="wishlist-music">
          <div className="wishlist-music-container">
            <div className="wishlist-music-grid">
                {visibleMusic.map((item) => (
                  <div
                    key={`music-${item.id}`}
                    className="wishlist-music-item"
                    onClick={() => navigate(`/music/${item.id}`)}
                  >
                    <div className="wishlist-music-item-image-wrapper">
                      <img
                        src={item.img || '/img/movie1.jpg'}
                        alt={getMusicTitle(item)}
                        className="wishlist-music-item-image"
                      />
                      <button
                        className="wishlist-music-item-wishlist-btn active"
                        onClick={(e) => handleMusicWishlistClick(e, item.id)}
                        aria-label="Sevimlilardan olib tashlash"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="wishlist-music-item-info">
                      <h3 className="wishlist-music-item-title">{getMusicTitle(item)}</h3>
                      <p className="wishlist-music-item-artist">{getArtistName(item.artistId)}</p>
                    </div>
                    <div className="wishlist-music-item-play">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {effectiveTab === 'klip' && (
        <div className="wishlist-music wishlist-music--clips">
          <div className="wishlist-music-container">
            <div className="wishlist-music-grid wishlist-music-grid--clips">
                {visibleClips.map((item) => (
                  <div
                    key={`${item.type || 'klip'}-${item.id}`}
                    className="wishlist-music-item wishlist-music-item--klip"
                    onClick={() => navigate(`/music/video/${item.id}`)}
                  >
                    <div className="wishlist-music-item-image-wrapper">
                      <img
                        src={item.img || '/img/movie1.jpg'}
                        alt={item.title}
                        className="wishlist-music-item-image"
                      />
                      <button
                        className="wishlist-music-item-wishlist-btn active"
                        onClick={(e) => handleClipWishlistClick(e, item.id, item.type || 'klip')}
                        aria-label="Sevimlilardan olib tashlash"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="wishlist-music-item-info">
                      <h3 className="wishlist-music-item-title">{item.title}</h3>
                      <p className="wishlist-music-item-artist">{getArtistName(item.artistId)}</p>
                    </div>
                    <div className="wishlist-music-item-play">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {effectiveTab === 'konsert' && (
        <div className="wishlist-music wishlist-music--clips">
          <div className="wishlist-music-container">
            <div className="wishlist-music-grid wishlist-music-grid--clips">
                {visibleConcerts.map((item) => (
                  <div
                    key={`konsert-${item.id}`}
                    className="wishlist-music-item wishlist-music-item--klip"
                    onClick={() => navigate(`/music/video/${item.id}`)}
                  >
                    <div className="wishlist-music-item-image-wrapper">
                      <img
                        src={item.img || '/img/movie1.jpg'}
                        alt={item.title}
                        className="wishlist-music-item-image"
                      />
                      <button
                        className="wishlist-music-item-wishlist-btn active"
                        onClick={(e) => handleClipWishlistClick(e, item.id, 'konsert')}
                        aria-label="Sevimlilardan olib tashlash"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="wishlist-music-item-info">
                      <h3 className="wishlist-music-item-title">{item.title}</h3>
                      <p className="wishlist-music-item-artist">{getArtistName(item.artistId)}</p>
                    </div>
                    <div className="wishlist-music-item-play">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {effectiveTab === 'triller' && (
        <div className="wishlist-music wishlist-music--clips">
          <div className="wishlist-music-container">
            <div className="wishlist-music-grid wishlist-music-grid--clips">
              {wishlistTrillers.map((item) => {
                const itemTitle = getLocalizedField(item.title, contentLang) || '';
                const itemImg =
                  getLocalizedField(item.videoImg, contentLang) || '/img/movie1.jpg';
                return (
                  <div
                    key={`triller-${item.id}`}
                    className="wishlist-music-item wishlist-music-item--klip wishlist-music-item--triller"
                    onClick={() => navigate(`/triller/${item.id}`)}
                  >
                    <div className="wishlist-music-item-image-wrapper">
                      <img
                        src={itemImg}
                        alt={itemTitle}
                        className="wishlist-music-item-image"
                      />
                      <button
                        className="wishlist-music-item-wishlist-btn active"
                        onClick={(e) => handleTrillerWishlistClick(e, item.id)}
                        aria-label="Sevimlilardan olib tashlash"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="wishlist-music-item-info">
                      <h3 className="wishlist-music-item-title">{itemTitle}</h3>
                    </div>
                    <div className="wishlist-music-item-play">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
