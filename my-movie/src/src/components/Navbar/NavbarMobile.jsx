import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import SearchModalGenre from '../SearchModalGenre/SearchModalGenre';
import SearchModalAnons from '../SearchModalAnons/SearchModalAnons';
import SearchModalTavsiya from '../SearchModalTavsiya/SearchModalTavsiya';
import SearchModalResults from '../SearchModalResults/SearchModalResults';
import SearchMusicResults from '../../Music/SearchMusicResults/SearchMusicResults';
import SearchMusicIstoriy from '../../Music/SearchMusicResults/SearchMusicIstoriy';
import SearchModalCategory from '../../Music/SearchMusicResults/SearchModalCategory';
import { useLoading } from '../../context/LoadingContext';
import './NavbarMobile.css';

const NavbarMobile = () => {
  const { t } = useTranslation();
  const { navbarLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isHomeActive = pathname === '/';
  const isSearchActive = pathname.startsWith('/search');
  const isMusicActive = pathname === '/music';
  const isWishlistActive = pathname === '/wishlist';
  const isMusicSection = pathname.startsWith('/music');
  const isShortsActive = isMusicSection ? pathname === '/music/shorts' : pathname === '/shorts';
  const isProfileActive = pathname === '/profile';

  const hasSearchQuery = searchQuery.trim().length > 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <>
      <nav className="navbar-mobile">
        {navbarLoading ? (
          <>
            <LoaderSkeleton variant="icon" className="navbar-mobile-skeleton-item" width={36} height={36} />
            <LoaderSkeleton variant="icon" className="navbar-mobile-skeleton-item" width={36} height={36} />
            <LoaderSkeleton variant="icon" className="navbar-mobile-skeleton-item" width={36} height={36} />
            <LoaderSkeleton variant="icon" className="navbar-mobile-skeleton-item" width={36} height={36} />
            <LoaderSkeleton variant="icon" className="navbar-mobile-skeleton-item" width={36} height={36} />
          </>
        ) : (
        <>
        <button
          className={`navbar-mobile-item ${isHomeActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => navigate('/')}
          aria-label={t('navbar.home')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>{t('navbar.home')}</span>
        </button>

        <button
          className={`navbar-mobile-item ${isSearchActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => setShowSearch(true)}
          aria-label={t('navbar.search')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>{t('navbar.search').replace('...', '')}</span>
        </button>

        <button
          className={`navbar-mobile-item ${isMusicActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => navigate('/music')}
          aria-label={t('navbar.music')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          <span>{t('navbar.music')}</span>
        </button>

        <button
          className={`navbar-mobile-item ${isWishlistActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => navigate('/wishlist')}
          aria-label={t('navbar.favorites')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>{t('navbar.favorites')}</span>
        </button>

        <button
          className={`navbar-mobile-item ${isShortsActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => navigate(isMusicSection ? '/music/shorts' : '/shorts')}
          aria-label={t('navbar.shorts')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="1" width="14" height="22" rx="3" ry="3" />
            <polygon points="10 7 10 17 16 12" fill="currentColor" stroke="none" />
          </svg>
          <span>{t('navbar.shorts')}</span>
        </button>

        <button
          className={`navbar-mobile-item ${isProfileActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => navigate('/profile')}
          aria-label={t('navbar.profile')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>{t('navbar.profile')}</span>
        </button>
        </>
        )}
      </nav>

      {showSearch && (
        <div
          className="navbar-mobile-search-overlay"
          onClick={(e) => {
            if (!e.target.closest('.navbar-mobile-search-box')) setShowSearch(false);
          }}
        >
          <div className="navbar-mobile-search-box" onClick={(e) => e.stopPropagation()}>
            <div className="navbar-mobile-search-form-row">
              <button type="button" className="navbar-mobile-search-back" onClick={() => setShowSearch(false)} aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <form onSubmit={handleSearchSubmit} className="navbar-mobile-search-form">
              <div className="navbar-mobile-search-input-wrap">
                <input
                  type="text"
                  placeholder={t('navbar.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="navbar-mobile-search-input"
                />
                <button
                  type="button"
                  className="navbar-mobile-search-icon-btn"
                  onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                  aria-label={searchQuery.trim() ? 'Tozalash' : t('navbar.search')}
                >
                  {searchQuery.trim() ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  )}
                </button>
              </div>
              </form>
            </div>
            {hasSearchQuery ? (
              isMusicSection ? (
                <SearchMusicResults
                  query={searchQuery.trim()}
                  onItemClick={() => setShowSearch(false)}
                />
              ) : (
                <SearchModalResults
                  query={searchQuery.trim()}
                  onMovieClick={() => setShowSearch(false)}
                />
              )
            ) : isMusicSection ? (
              <div className="navbar-search-modal-music-empty">
                <SearchModalCategory onCategoryClick={() => setShowSearch(false)} />
                <SearchMusicIstoriy onItemClick={() => setShowSearch(false)} />
              </div>
            ) : (
              <>
                <SearchModalGenre onGenreClick={() => setShowSearch(false)} />
                <SearchModalAnons onAnonsClick={() => setShowSearch(false)} />
                <SearchModalTavsiya onMovieClick={() => setShowSearch(false)} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarMobile;
