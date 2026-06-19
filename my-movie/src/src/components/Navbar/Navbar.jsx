import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import LanguageModal from './LanguageModal';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import SearchModalGenre from '../SearchModalGenre/SearchModalGenre';
import SearchModalAnons from '../SearchModalAnons/SearchModalAnons';
import SearchModalTavsiya from '../SearchModalTavsiya/SearchModalTavsiya';
import SearchModalResults from '../SearchModalResults/SearchModalResults';
import SearchMusicResults from '../../Music/SearchMusicResults/SearchMusicResults';
import SearchMusicIstoriy from '../../Music/SearchMusicResults/SearchMusicIstoriy';
import SearchModalCategory from '../../Music/SearchMusicResults/SearchModalCategory';
import { useLoading } from '../../context/LoadingContext';
import './Navbar.css';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { navbarLoading, setLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const isMusicPage = location.pathname === '/music';
  const isMusicSection = location.pathname.startsWith('/music');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
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
    setLoading('navbar', true);
    const timer = setTimeout(() => setLoading('navbar', false), 400);
    return () => clearTimeout(timer);
  }, [setLoading]);

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
      if (e.key === 'Escape') setShowSearchModal(false);
    };
    if (showSearchModal) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSearchModal]);

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
    if (!navbarLoading) setShowSearchModal(true);
  };

  return (
    <>
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-logo" onClick={() => !navbarLoading && navigate('/')}>
            {navbarLoading ? (
              <LoaderSkeleton variant="logo" className="navbar-logo-img-skeleton" width={120} height={40} />
            ) : (
              <img src="/img/vll_preview_rev_1.png" alt="VIOLET" className="navbar-logo-img" />
            )}
          </div>
          <button
            className="navbar-mobile-search-trigger"
            onClick={openSearchModal}
            aria-label={t('navbar.search')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        <div className="navbar-center navbar-desktop-only">
          <form onSubmit={handleSearch} className="navbar-search">
            <div className="navbar-search-wrap" ref={searchInputRef}>
              {navbarLoading ? (
                <LoaderSkeleton variant="search" className="navbar-search-skeleton" width="100%" height={44} />
              ) : (
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
              </>
              )}
            </div>
          </form>
        </div>

        <div className="navbar-right">
          {navbarLoading ? (
            <>
              <LoaderSkeleton variant="icon" className="navbar-icon-skeleton navbar-desktop-only" width={40} height={40} />
              <LoaderSkeleton variant="icon" className="navbar-icon-skeleton navbar-desktop-only" width={40} height={40} />
              <LoaderSkeleton variant="icon" className="navbar-icon-skeleton navbar-desktop-only" width={40} height={40} />
              <LoaderSkeleton variant="language-btn" className="navbar-language-skeleton" width={50} height={35} />
            </>
          ) : (
          <>
          <button
            className="navbar-icon-btn navbar-desktop-only"
            onClick={() => navigate('/wishlist')}
            aria-label="Favorites"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          <button
            className={`navbar-icon-btn navbar-desktop-only ${isMusicSection && location.pathname === '/music/shorts' ? 'navbar-icon-active' : ''}`}
            onClick={() => navigate(isMusicSection ? '/music/shorts' : '/shorts')}
            aria-label={isMusicSection ? t('navbar.musicShorts', 'Music Shorts') : t('navbar.shorts')}
          >
            {isMusicSection ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="1" width="14" height="22" rx="3" ry="3" />
                <polygon points="10 7 10 17 16 12" fill="currentColor" stroke="none" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="1" width="14" height="22" rx="3" ry="3" />
                <polygon points="10 7 10 17 16 12" fill="currentColor" stroke="none" />
              </svg>
            )}
          </button>

          <button
            className={`navbar-icon-btn navbar-desktop-only ${isMusicPage ? 'navbar-icon-active' : ''}`}
            onClick={() => navigate('/music')}
            aria-label={t('navbar.music')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </button>

          <button
            className="navbar-icon-btn navbar-desktop-only"
            onClick={() => navigate('/profile')}
            aria-label={t('navbar.profile')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
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
          )}
        </div>
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
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
    </>
  );
};

export default Navbar;
