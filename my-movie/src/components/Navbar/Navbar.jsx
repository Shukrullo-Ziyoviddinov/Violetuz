import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import LanguageModal from './LanguageModal';
import SearchModalGenre from '../SearchModalGenre/SearchModalGenre';
import SearchModalAnons from '../SearchModalAnons/SearchModalAnons';
import SearchModalTavsiya from '../SearchModalTavsiya/SearchModalTavsiya';
import SearchModalResults from '../SearchModalResults/SearchModalResults';
import SearchMusicResults from '../../Music/SearchMusicResults/SearchMusicResults';
import SearchMusicIstoriy from '../../Music/SearchMusicResults/SearchMusicIstoriy';
import SearchModalCategory from '../../Music/SearchMusicResults/SearchModalCategory';
import { requestOpenProfileInfoMenu } from '../../profileInfoMenuBridge';
import { requestOpenMessagesModal } from '../../messagesModalBridge';
import ShortsPickerModal from './ShortsPickerModal';
import './Navbar.css';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isMusicPage = location.pathname === '/music';
  const isMusicSection = location.pathname.startsWith('/music');
  const isFeedPage = location.pathname === '/feed';
  const isMoviesPage = location.pathname === '/' || location.pathname.startsWith('/movie/');
  const isShortsPage =
    location.pathname === '/shorts' || location.pathname === '/music/shorts';
  const isProfilePage = location.pathname === '/profile';
  const isMovieDetailPage = /^\/movie\/\d+$/.test(location.pathname);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showShortsPicker, setShowShortsPicker] = useState(false);
  const languageWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  const updateModalPosition = () => {
    if (modalRef.current && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      modalRef.current.style.setProperty('--modal-top', `${rect.bottom + 8}px`);
      modalRef.current.style.setProperty('--modal-left', `${rect.left + rect.width / 2}px`);
      modalRef.current.style.setProperty('--modal-width', `${rect.width}px`);
    }
  };

  const languages = [
    { code: 'uz', image: '/img/uzb-by.jpg' },
    { code: 'ru', image: '/img/rubay.png' }
  ];

  const getCurrentLanguage = () => {
    let lang = i18n.language || localStorage.getItem('i18nextLng') || 'uz';
    
    if (lang && typeof lang === 'string') {
      lang = lang.toLowerCase().split('-')[0];
    }
    
    if (lang === 'uz' || lang === 'ru') {
      return lang;
    }
    return 'uz';
  };

  const currentLanguage = getCurrentLanguage();
  const currentLanguageImage = languages.find(lang => lang.code === currentLanguage)?.image || languages[0].image;

  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng') || 'uz';
    if (savedLanguage === 'uz' || savedLanguage === 'ru') {
      i18n.changeLanguage(savedLanguage);
    } else {
      i18n.changeLanguage('uz');
      localStorage.setItem('i18nextLng', 'uz');
    }
  }, [i18n]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageWrapperRef.current && !languageWrapperRef.current.contains(event.target)) {
        setShowLanguageModal(false);
      }
    };

    if (showLanguageModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageModal]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowShortsPicker(false);
      }
    };
    if (showSearchModal || showShortsPicker) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSearchModal, showShortsPicker]);

  useEffect(() => {
    if (!showSearchModal) return;
    updateModalPosition();
    const handleResize = () => updateModalPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSearchModal]);

  const handleLanguageChange = (langCode) => {
    if (langCode === 'uz' || langCode === 'ru') {
      i18n.changeLanguage(langCode);
      localStorage.setItem('i18nextLng', langCode);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Enter bosilganda sahifaga o'tmaslik, natijalar modaldagi qoladi
  };

  const openSearchModal = () => {
    setShowSearchModal(true);
  };

  return (
    <>
    <nav className={`navbar${isProfilePage ? ' navbar--profile-page' : ''}${isFeedPage ? ' navbar--feed-page' : ''}${isMovieDetailPage ? ' navbar--movie-detail-page' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-logo" onClick={() => navigate('/')}>
            <img src="/img/vll_preview_rev_1.png" alt="VIOLET" className="navbar-logo-img" />
          </div>
          <button
            className="navbar-mobile-search-trigger"
            onClick={openSearchModal}
            aria-label={t('navbar.search')}
          >
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          </button>
        </div>

        <div className="navbar-center navbar-desktop-only">
          <form onSubmit={handleSearch} className="navbar-search">
            <div className="navbar-search-wrap" ref={searchInputRef}>
              <>
              <input
                type="text"
                placeholder={t('navbar.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={openSearchModal}
                className="navbar-search-input"
              />
              <button
                type="button"
                className="navbar-search-icon"
                onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                aria-label={searchQuery.trim() ? 'Tozalash' : t('navbar.search')}
              >
                {searchQuery.trim() ? (
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                ) : (
                  <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                )}
              </button>
              </>
            </div>
          </form>
        </div>

        <div className="navbar-right">
          <>
          <button
            className={`navbar-icon-btn navbar-desktop-only ${isFeedPage ? 'navbar-icon-active' : ''}`}
            onClick={() => navigate('/feed')}
            aria-label={t('navbar.home')}
          >
            <i className="fa-solid fa-house" aria-hidden="true" />
          </button>

          <button
            className={`navbar-icon-btn navbar-desktop-only ${isShortsPage ? 'navbar-icon-active' : ''}`}
            onClick={() => setShowShortsPicker(true)}
            aria-label={t('navbar.shorts')}
          >
            <i className="fa-solid fa-clapperboard" aria-hidden="true" />
          </button>

          <button
            className={`navbar-icon-btn navbar-desktop-only ${isMusicPage ? 'navbar-icon-active' : ''}`}
            onClick={() => navigate('/music')}
            aria-label={t('navbar.music')}
          >
            <i className="fa-solid fa-music" aria-hidden="true" />
          </button>

          <button
            className={`navbar-icon-btn navbar-desktop-only ${isMoviesPage ? 'navbar-icon-active' : ''}`}
            onClick={() => navigate('/')}
            aria-label={t('navbar.movies')}
          >
            <i className="fa-solid fa-film" aria-hidden="true" />
          </button>

          <button
            className="navbar-icon-btn navbar-desktop-only"
            onClick={() => navigate('/profile')}
            aria-label={t('navbar.profile')}
          >
            <i className="fa-solid fa-user" aria-hidden="true" />
          </button>

          <div className="navbar-language-wrapper" ref={languageWrapperRef}>
            <button
              className="navbar-language-btn"
              onClick={() => setShowLanguageModal(!showLanguageModal)}
              aria-label="Language"
            >
              <img
                src={currentLanguageImage}
                alt="Language"
                className="navbar-language-flag-image"
              />
            </button>
            {showLanguageModal && (
              <LanguageModal
                onClose={() => setShowLanguageModal(false)}
                onLanguageChange={handleLanguageChange}
                currentLanguage={currentLanguage}
              />
            )}
          </div>
          </>
        </div>

        {isFeedPage && (
          <button
            type="button"
            className="navbar-feed-messages-mobile"
            onClick={requestOpenMessagesModal}
            aria-label={t('feed.messages')}
          >
            <i className="fa-solid fa-comments" aria-hidden="true" />
          </button>
        )}

        {isProfilePage && (
          <div className="navbar-profile-mobile-actions">
            <button
              type="button"
              className="navbar-profile-menu-btn"
              onClick={requestOpenProfileInfoMenu}
              aria-label={t('profile.settingsAndActivity')}
            >
              <span className="navbar-profile-menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        )}
      </div>
    </nav>

    {showSearchModal && (
      <div
          className="navbar-search-modal-overlay"
          onClick={(e) => {
            if (!e.target.closest('.navbar-search-modal')) setShowSearchModal(false);
          }}
        >
        <div
          ref={modalRef}
          className="navbar-search-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="navbar-search-modal-inner">
            <div
              className={`navbar-search-modal-form-row ${searchQuery.trim() ? 'navbar-search-modal-form-row--has-query' : ''}`}
            >
              <button
                type="button"
                className="navbar-search-modal-back"
                onClick={() => setShowSearchModal(false)}
                aria-label="Close"
              >
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
              </button>
              <form onSubmit={handleSearch} className="navbar-search-modal-form navbar-search-modal-form-mobile">
                <div className="navbar-search-input-wrap">
                  <input
                    type="text"
                    placeholder={t('navbar.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="navbar-search-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="navbar-search-icon-btn"
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
            {searchQuery.trim() ? (
              isMusicSection ? (
                <SearchMusicResults
                  query={searchQuery.trim()}
                  onItemClick={() => setShowSearchModal(false)}
                />
              ) : (
                <SearchModalResults
                  query={searchQuery.trim()}
                  onMovieClick={() => setShowSearchModal(false)}
                />
              )
            ) : isMusicSection ? (
              <div className="navbar-search-modal-music-empty">
                <SearchModalCategory onCategoryClick={() => setShowSearchModal(false)} />
                <SearchMusicIstoriy onItemClick={() => setShowSearchModal(false)} />
              </div>
            ) : (
              <>
                <SearchModalGenre onGenreClick={() => setShowSearchModal(false)} />
                <SearchModalAnons onAnonsClick={() => setShowSearchModal(false)} />
                <SearchModalTavsiya onMovieClick={() => setShowSearchModal(false)} />
              </>
            )}
          </div>
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

export default Navbar;
