import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchModalGenre from '../SearchModalGenre/SearchModalGenre';
import SearchModalAnons from '../SearchModalAnons/SearchModalAnons';
import SearchModalTavsiya from '../SearchModalTavsiya/SearchModalTavsiya';
import SearchModalResults from '../SearchModalResults/SearchModalResults';
import SearchMusicResults from '../../Music/SearchMusicResults/SearchMusicResults';
import SearchMusicIstoriy from '../../Music/SearchMusicResults/SearchMusicIstoriy';
import SearchModalCategory from '../../Music/SearchMusicResults/SearchModalCategory';
import ShortsPickerModal from './ShortsPickerModal';
import './NavbarMobile.css';

const NavbarMobile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [showSearch, setShowSearch] = useState(false);
  const [showShortsPicker, setShowShortsPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isHomeActive = pathname === '/feed';
  const isSearchActive = pathname.startsWith('/search');
  const isMusicActive = pathname === '/music';
  const isMoviesActive = pathname === '/' || pathname.startsWith('/movie/');
  const isMusicSection = pathname.startsWith('/music');
  const isShortsActive = pathname === '/shorts' || pathname === '/music/shorts';
  const isProfileActive = pathname === '/profile';

  const hasSearchQuery = searchQuery.trim().length > 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <>
      <nav className="navbar-mobile">
        <button
          className={`navbar-mobile-item ${isHomeActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => navigate('/feed')}
          aria-label={t('navbar.mobileHome')}
        >
          <i className="fa-solid fa-house" aria-hidden="true" />
          <span>{t('navbar.mobileHome')}</span>
        </button>

        <button
          className={`navbar-mobile-item ${isSearchActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => setShowSearch(true)}
          aria-label={t('navbar.mobileSearch')}
        >
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <span>{t('navbar.mobileSearch')}</span>
        </button>

        <button
          className={`navbar-mobile-item ${isMusicActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => navigate('/music')}
          aria-label={t('navbar.mobileMusic')}
        >
          <i className="fa-solid fa-music" aria-hidden="true" />
          <span>{t('navbar.mobileMusic')}</span>
        </button>

        <button
          className={`navbar-mobile-item ${isMoviesActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => navigate('/')}
          aria-label={t('navbar.mobileMovies')}
        >
          <i className="fa-solid fa-film" aria-hidden="true" />
          <span>{t('navbar.mobileMovies')}</span>
        </button>

        <button
          className={`navbar-mobile-item ${isShortsActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => setShowShortsPicker(true)}
          aria-label={t('navbar.mobileShorts')}
        >
          <i className="fa-solid fa-clapperboard" aria-hidden="true" />
          <span>{t('navbar.mobileShorts')}</span>
        </button>

        <button
          className={`navbar-mobile-item ${isProfileActive ? 'navbar-mobile-item-active' : ''}`}
          onClick={() => navigate('/profile')}
          aria-label={t('navbar.mobileProfile')}
        >
          <i className="fa-solid fa-user" aria-hidden="true" />
          <span>{t('navbar.mobileProfile')}</span>
        </button>
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
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
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
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  ) : (
                    <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
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

      <ShortsPickerModal
        isOpen={showShortsPicker}
        onClose={() => setShowShortsPicker(false)}
        onPick={(path) => navigate(path)}
      />
    </>
  );
};

export default NavbarMobile;
