import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import LanguageModal from './LanguageModal';
import SearchModalBody from '../SearchModalBody/SearchModalBody';
import { requestOpenProfileInfoMenu } from '../../profileInfoMenuBridge';
import { requestOpenMessagesModal } from '../../messagesModalBridge';
import { requestOpenAuthModal } from '../../authModalBridge';
import { requestOpenSearchModal } from '../../searchModalBridge';
import {
  SEARCH_MODE_BROWSE,
  SEARCH_MODE_COMPOSE,
} from '../../searchModalModes';
import { useSearchHardwareBack } from '../../useSearchHardwareBack';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../UserAvatar/UserAvatar';
import ShortsPickerModal from './ShortsPickerModal';
import './Navbar.css';

const MOBILE_NAV_MAX = 768;

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, profile } = useAuth();
  const isMusicPage = location.pathname === '/music';
  const isFeedPage = location.pathname === '/feed';
  const isMoviesPage = location.pathname === '/' || location.pathname.startsWith('/movie/');
  const isShortsPage =
    location.pathname === '/shorts' || location.pathname === '/music/shorts';
  const isProfilePage = location.pathname === '/profile';
  const isMovieDetailPage = /^\/movie\/\d+$/.test(location.pathname);
  const isMusicDetailPage = /^\/music\/\d+$/.test(location.pathname);
  const isVideoDetailPage = /^\/music\/video\/[^/]+$/.test(location.pathname);
  const isMusicAlbumDetailPage = /^\/music\/album\/[^/]+$/.test(location.pathname);
  const hideTopNavbarOnMobile =
    isMovieDetailPage || isMusicDetailPage || isVideoDetailPage || isMusicAlbumDetailPage;
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchMode, setSearchMode] = useState(SEARCH_MODE_BROWSE);
  const [showShortsPicker, setShowShortsPicker] = useState(false);
  const languageWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const modalInputRef = useRef(null);
  const modalRef = useRef(null);
  const handleSearchBackRef = useRef(() => {});

  const hasSearchQuery = searchQuery.trim().length > 0;

  const returnSearchToBrowse = () => {
    setSearchQuery('');
    setSearchMode(SEARCH_MODE_BROWSE);
    modalInputRef.current?.blur();
    desktopSearchInputRef.current?.blur();
  };

  const finishCloseSearch = () => {
    setShowSearchModal(false);
    setSearchMode(SEARCH_MODE_BROWSE);
    setSearchQuery('');
    modalInputRef.current?.blur();
    desktopSearchInputRef.current?.blur();
  };

  const { markSearchHistoryOpen, releaseSearchHistory, abandonSearchHistory } =
    useSearchHardwareBack({
      showSearch: showSearchModal,
      searchMode,
      hasQuery: hasSearchQuery,
      onReturnToBrowse: returnSearchToBrowse,
      onCloseFromHardware: finishCloseSearch,
    });

  const updateModalPosition = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= MOBILE_NAV_MAX) return;
    if (modalRef.current && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      if (!rect.width) return;
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
      if (e.key !== 'Escape') return;
      if (showShortsPicker) {
        setShowShortsPicker(false);
        return;
      }
      if (!showSearchModal) return;
      handleSearchBackRef.current();
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

  useEffect(() => {
    if (!showSearchModal || searchMode !== SEARCH_MODE_COMPOSE) return undefined;
    const id = window.requestAnimationFrame(() => {
      const isMobile =
        typeof window !== 'undefined' && window.innerWidth <= MOBILE_NAV_MAX;
      const el = isMobile ? modalInputRef.current : desktopSearchInputRef.current;
      if (el && document.activeElement !== el) {
        el.focus();
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [showSearchModal, searchMode]);

  useEffect(() => {
    if (!showSearchModal) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
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

  const closeSearchModal = () => {
    finishCloseSearch();
    releaseSearchHistory();
  };

  const leaveSearchForNavigation = () => {
    abandonSearchHistory();
    finishCloseSearch();
  };

  const openSearchBrowse = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= MOBILE_NAV_MAX) {
      requestOpenSearchModal();
      return;
    }
    setShowSearchModal(true);
    setSearchMode(SEARCH_MODE_BROWSE);
    markSearchHistoryOpen();
  };

  /** Faqat desktop — mobile compose NavbarMobile’da */
  const enterSearchCompose = () => {
    setShowSearchModal(true);
    setSearchMode(SEARCH_MODE_COMPOSE);
    markSearchHistoryOpen();
  };

  /** Ortga: compose/yozish → browse; browse → modal yopiladi */
  const handleSearchBack = () => {
    if (searchMode === SEARCH_MODE_COMPOSE || searchQuery.trim()) {
      returnSearchToBrowse();
      return;
    }
    closeSearchModal();
  };

  handleSearchBackRef.current = handleSearchBack;

  const handleNavbarSearchActivate = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= MOBILE_NAV_MAX) {
      requestOpenSearchModal();
      return;
    }
    if (!showSearchModal) {
      openSearchBrowse();
      return;
    }
    if (searchMode === SEARCH_MODE_BROWSE) {
      enterSearchCompose();
    }
  };

  const isComposing = searchMode === SEARCH_MODE_COMPOSE;

  const handleQueryChange = (value) => {
    setSearchQuery(value);
    if (value.trim() && searchMode !== SEARCH_MODE_COMPOSE) {
      setSearchMode(SEARCH_MODE_COMPOSE);
    }
  };

  /** Natijani tozalash — compose/tarixda qoladi (browse’ga tushmaydi) */
  const clearSearchQuery = () => {
    setSearchQuery('');
    setSearchMode(SEARCH_MODE_COMPOSE);
  };

  return (
    <>
    <nav className={`navbar${isProfilePage ? ' navbar--profile-page' : ''}${isFeedPage ? ' navbar--feed-page' : ''}${hideTopNavbarOnMobile ? ' navbar--hide-mobile-top' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-logo" onClick={() => navigate('/')}>
            <img
              src="/img/newlogo_preview_rev_1.png"
              alt="VIOLET"
              className="navbar-logo-img navbar-logo-img--desktop"
            />
            <img
              src="/img/vlvioletplay_preview_rev_1.png"
              alt="VL"
              className="navbar-logo-img navbar-logo-img--mobile"
            />
          </div>
          <button
            type="button"
            className="navbar-mobile-search-trigger"
            onClick={openSearchBrowse}
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
                ref={desktopSearchInputRef}
                type="text"
                placeholder={t('navbar.search')}
                value={searchQuery}
                readOnly={!isComposing}
                onChange={(e) => handleQueryChange(e.target.value)}
                onMouseDown={(e) => {
                  // Browse/yopiq: focus ochilmasin (aks holda darhol compose bo‘ladi)
                  if (!isComposing) e.preventDefault();
                }}
                onClick={handleNavbarSearchActivate}
                onFocus={(e) => {
                  if (!isComposing) e.target.blur();
                }}
                className="navbar-search-input"
              />
              <button
                type="button"
                className="navbar-search-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasSearchQuery) {
                    clearSearchQuery();
                    return;
                  }
                  handleNavbarSearchActivate();
                }}
                aria-label={hasSearchQuery ? t('searchModal.clear', 'Tozalash') : t('navbar.search')}
              >
                {hasSearchQuery ? (
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
            onClick={() => {
              if (isLoggedIn) navigate('/profile');
              else requestOpenAuthModal('register');
            }}
            aria-label={t('navbar.profile')}
          >
            <UserAvatar
              src={profile?.avatar}
              className="navbar-user-avatar"
              fallback={<i className="fa-solid fa-user" aria-hidden="true" />}
            />
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

        <div className="navbar-mobile-actions">
          {!isFeedPage ? (
            <button
              type="button"
              className="navbar-mobile-action-btn navbar-mobile-search-btn"
              onClick={openSearchBrowse}
              aria-label={t('navbar.search')}
            >
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            </button>
          ) : null}

          {isFeedPage ? (
            <button
              type="button"
              className="navbar-feed-messages-mobile"
              onClick={requestOpenMessagesModal}
              aria-label={t('feed.messages')}
            >
              <i className="fa-solid fa-comments" aria-hidden="true" />
            </button>
          ) : null}

          <button
            type="button"
            className="navbar-mobile-action-btn navbar-mobile-bell-btn"
            aria-label={t('navbar.notifications', 'Bildirishnomalar')}
          >
            <i className="fa-solid fa-bell" aria-hidden="true" />
          </button>
        </div>

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
          role="presentation"
          onClick={(e) => {
            if (!e.target.closest('.navbar-search-modal')) closeSearchModal();
          }}
        >
        <div
          ref={modalRef}
          className="navbar-search-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t('navbar.search')}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="navbar-search-modal-inner">
            <div
              className={`navbar-search-modal-form-row ${hasSearchQuery ? 'navbar-search-modal-form-row--has-query' : ''}`}
            >
              <button
                type="button"
                className="navbar-search-modal-back"
                onClick={handleSearchBack}
                aria-label={t('searchModal.back', 'Orqaga')}
              >
                <i className="fa-solid fa-angle-left" aria-hidden="true" />
              </button>
              <form onSubmit={handleSearch} className="navbar-search-modal-form navbar-search-modal-form-mobile">
                <div className="navbar-search-input-wrap">
                  <input
                    ref={modalInputRef}
                    type="text"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    placeholder={t('navbar.search')}
                    value={searchQuery}
                    readOnly={!isComposing}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onClick={() => {
                      if (searchMode === SEARCH_MODE_BROWSE) {
                        setSearchMode(SEARCH_MODE_COMPOSE);
                      }
                    }}
                    onFocus={() => {
                      if (searchMode === SEARCH_MODE_BROWSE) {
                        setSearchMode(SEARCH_MODE_COMPOSE);
                      }
                    }}
                    className="navbar-search-input"
                  />
                  <button
                    type="button"
                    className="navbar-search-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasSearchQuery) clearSearchQuery();
                      else if (searchMode === SEARCH_MODE_BROWSE) {
                        setSearchMode(SEARCH_MODE_COMPOSE);
                      }
                    }}
                    aria-label={hasSearchQuery ? t('searchModal.clear', 'Tozalash') : t('navbar.search')}
                  >
                    {hasSearchQuery ? (
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    ) : (
                      <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </form>
            </div>
            <SearchModalBody
              query={searchQuery}
              searchMode={searchMode}
              onNavigateAway={leaveSearchForNavigation}
            />
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
