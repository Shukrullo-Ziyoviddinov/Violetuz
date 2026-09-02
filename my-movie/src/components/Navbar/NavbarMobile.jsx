import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchModalBody from '../SearchModalBody/SearchModalBody';
import ShortsPickerModal from './ShortsPickerModal';
import VoiceSearchModal from '../VoiceSearch/VoiceSearchModal';
import { isVoiceSearchAvailable } from '../VoiceSearch/voiceSearchSupport';
import { requestOpenAuthModal } from '../../authModalBridge';
import { OPEN_SEARCH_EVENT } from '../../searchModalBridge';
import {
  SEARCH_MODE_BROWSE,
  SEARCH_MODE_COMPOSE,
} from '../../searchModalModes';
import { useSearchHardwareBack } from '../../useSearchHardwareBack';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../UserAvatar/UserAvatar';
import './NavbarMobile.css';

const NavbarMobile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, profile } = useAuth();
  const pathname = location.pathname;
  const [showSearch, setShowSearch] = useState(false);
  /** Yopilish slide — DOM unmount kechiktiriladi */
  const [searchExiting, setSearchExiting] = useState(false);
  /** Ochilish slide — mount dan keyin --in class */
  const [searchEntered, setSearchEntered] = useState(false);
  const [searchMode, setSearchMode] = useState(SEARCH_MODE_BROWSE);
  const [showShortsPicker, setShowShortsPicker] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);
  const handleSearchBackRef = useRef(() => {});
  const searchClosingRef = useRef(false);
  const voiceSearchSupported = isVoiceSearchAvailable();

  const isHomeActive = pathname === '/feed';
  const isSearchActive = pathname.startsWith('/search');
  const isMusicActive = pathname === '/music';
  const isMoviesActive = pathname === '/' || pathname.startsWith('/movie/');
  const isShortsActive = pathname === '/shorts' || pathname === '/music/shorts';
  const isProfileActive = pathname === '/profile';

  const hasSearchQuery = searchQuery.trim().length > 0;
  const isComposing = searchMode === SEARCH_MODE_COMPOSE;
  const searchInDom = showSearch || searchExiting;
  const searchSlideIn = searchEntered && !searchExiting;

  const returnSearchToBrowse = () => {
    setSearchQuery('');
    setSearchMode(SEARCH_MODE_BROWSE);
    inputRef.current?.blur();
  };

  /** Holat tozalash + unmount (animatsiya tugagach yoki navigatsiya) */
  const unmountSearchModal = () => {
    searchClosingRef.current = false;
    setShowSearch(false);
    setSearchExiting(false);
    setSearchEntered(false);
    setSearchMode(SEARCH_MODE_BROWSE);
    setSearchQuery('');
    setShowVoiceSearch(false);
    inputRef.current?.blur();
  };

  /** Yopilish slide boshlash (hardware / UI ortga) */
  const beginCloseSearch = () => {
    if (searchClosingRef.current || searchExiting) return;
    searchClosingRef.current = true;
    setSearchExiting(true);
    setShowSearch(false);
    setShowVoiceSearch(false);
    inputRef.current?.blur();
  };

  const { markSearchHistoryOpen, releaseSearchHistory, abandonSearchHistory } =
    useSearchHardwareBack({
      showSearch,
      searchMode,
      hasQuery: hasSearchQuery,
      onReturnToBrowse: returnSearchToBrowse,
      onCloseFromHardware: beginCloseSearch,
      blocked: showVoiceSearch,
    });

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

  const closeSearchModal = () => {
    if (searchClosingRef.current || searchExiting) return;
    beginCloseSearch();
    releaseSearchHistory();
  };

  /** Natija/tarix item → sahifa: animatsiyasiz yopiladi */
  const leaveSearchForNavigation = () => {
    abandonSearchHistory();
    unmountSearchModal();
  };

  const openSearchBrowse = () => {
    if (showSearch || searchExiting) return;
    searchClosingRef.current = false;
    setSearchExiting(false);
    setSearchEntered(false);
    setShowSearch(true);
    setSearchMode(SEARCH_MODE_BROWSE);
    inputRef.current?.blur();
    markSearchHistoryOpen();
  };

  const handleSearchBoxTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;
    if (!searchExiting) return;
    unmountSearchModal();
  };

  /** Ortga: compose/yozish → browse; browse → modal yopiladi */
  const handleSearchBack = () => {
    if (searchMode === SEARCH_MODE_COMPOSE || hasSearchQuery) {
      returnSearchToBrowse();
      return;
    }
    closeSearchModal();
  };

  const enterCompose = () => {
    setSearchMode(SEARCH_MODE_COMPOSE);
  };

  handleSearchBackRef.current = handleSearchBack;

  useEffect(() => {
    const open = () => openSearchBrowse();
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, open);
  }, []);

  /** Mount → keyingi frame’da slide-in */
  useEffect(() => {
    if (!showSearch || searchExiting) return undefined;
    let innerId = 0;
    const outerId = window.requestAnimationFrame(() => {
      innerId = window.requestAnimationFrame(() => {
        setSearchEntered(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(outerId);
      window.cancelAnimationFrame(innerId);
    };
  }, [showSearch, searchExiting]);

  /** transitionend bo‘lmasa ham (reduced-motion) unmount */
  useEffect(() => {
    if (!searchExiting) return undefined;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setTimeout(() => {
      unmountSearchModal();
    }, reduced ? 0 : 380);
    return () => window.clearTimeout(id);
  }, [searchExiting]);

  useEffect(() => {
    if (!showSearch || searchMode !== SEARCH_MODE_COMPOSE) return undefined;
    const id = window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el && document.activeElement !== el) {
        el.focus();
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [showSearch, searchMode]);

  useEffect(() => {
    if (!searchInDom) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [searchInDom]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (showVoiceSearch) return;
      if (showShortsPicker) {
        setShowShortsPicker(false);
        return;
      }
      if (!showSearch && !searchExiting) return;
      handleSearchBackRef.current();
    };
    if (searchInDom || showShortsPicker) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [searchInDom, showSearch, searchExiting, showShortsPicker, showVoiceSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleVoiceSearchResult = (text) => {
    const value = typeof text === 'string' ? text.trim() : '';
    if (!value) return;
    handleQueryChange(value);
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
          onClick={openSearchBrowse}
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
          onClick={() => {
            if (isLoggedIn) navigate('/profile');
            else requestOpenAuthModal('register');
          }}
          aria-label={t('navbar.mobileProfile')}
        >
          <UserAvatar
            src={profile?.avatar}
            className="navbar-user-avatar navbar-user-avatar--mobile"
            fallback={<i className="fa-solid fa-user" aria-hidden="true" />}
          />
          <span>{t('navbar.mobileProfile')}</span>
        </button>
      </nav>

      {searchInDom && (
        <div
          className="navbar-mobile-search-overlay"
          role="presentation"
          onClick={(e) => {
            if (!e.target.closest('.navbar-mobile-search-box')) closeSearchModal();
          }}
        >
          <div
            className={`navbar-mobile-search-box${
              searchSlideIn ? ' navbar-mobile-search-box--in' : ''
            }`}
            role="dialog"
            aria-modal="true"
            aria-label={t('navbar.search')}
            onClick={(e) => e.stopPropagation()}
            onTransitionEnd={handleSearchBoxTransitionEnd}
          >
            <div className="navbar-mobile-search-form-row">
              <button
                type="button"
                className="navbar-mobile-search-back"
                onClick={handleSearchBack}
                aria-label={t('searchModal.back', 'Orqaga')}
              >
                <i className="fa-solid fa-angle-left" aria-hidden="true" />
              </button>
              <form onSubmit={handleSearchSubmit} className="navbar-mobile-search-form">
              <div className="navbar-mobile-search-input-wrap">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder={t('navbar.search')}
                  value={searchQuery}
                  readOnly={!isComposing}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onClick={enterCompose}
                  onFocus={enterCompose}
                  className="navbar-mobile-search-input"
                />
                <button
                  type="button"
                  className="navbar-mobile-search-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasSearchQuery) {
                      clearSearchQuery();
                      return;
                    }
                    enterCompose();
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
              {voiceSearchSupported ? (
                <button
                  type="button"
                  className="navbar-mobile-search-mic"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVoiceSearch(true);
                  }}
                  aria-label={t('voiceSearch.mic', 'Mikrofon')}
                >
                  <i className="fa-solid fa-microphone" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <SearchModalBody
              query={searchQuery}
              searchMode={searchMode}
              onNavigateAway={leaveSearchForNavigation}
            />
          </div>
        </div>
      )}

      <VoiceSearchModal
        isOpen={showVoiceSearch}
        onClose={() => setShowVoiceSearch(false)}
        onResult={handleVoiceSearchResult}
        onNavigateAway={leaveSearchForNavigation}
      />

      <ShortsPickerModal
        isOpen={showShortsPicker}
        onClose={() => setShowShortsPicker(false)}
        onPick={(path) => navigate(path)}
      />
    </>
  );
};

export default NavbarMobile;
