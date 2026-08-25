import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchModalGenre from '../SearchModalGenre/SearchModalGenre';
import SearchModalAnons from '../SearchModalAnons/SearchModalAnons';
import SearchModalTavsiya from '../SearchModalTavsiya/SearchModalTavsiya';
import SearchModalCategory from '../../Music/SearchMusicResults/SearchModalCategory';
import SearchModalHistory from '../SearchModalHistory/SearchModalHistory';
import './SearchModalBrowseShell.css';

const SLIDE_MS = 380;

/**
 * Bo‘sh qidiruv: Siz uchun tavsiya | Qidiruv tarixlari + slide.
 * Default tab: tavsiya. Tarix tab ochilganda list yuklanadi (enabled).
 * Desktop: tablar modal yuqorisida (form yashirin).
 * Mobile: input qatori ostida.
 */
const SearchModalBrowseShell = ({ onNavigateAway }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('tavsiya');
  const [slideDone, setSlideDone] = useState(true);
  const slideTimerRef = useRef(null);

  const close = () => onNavigateAway?.();

  const selectTab = (tab) => {
    if (tab === activeTab) return;
    setSlideDone(false);
    setActiveTab(tab);
  };

  useEffect(() => {
    if (slideTimerRef.current) {
      clearTimeout(slideTimerRef.current);
      slideTimerRef.current = null;
    }

    if (slideDone) return undefined;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = reducedMotion ? 0 : SLIDE_MS;

    slideTimerRef.current = setTimeout(() => {
      setSlideDone(true);
      slideTimerRef.current = null;
    }, delay);

    return () => {
      if (slideTimerRef.current) {
        clearTimeout(slideTimerRef.current);
        slideTimerRef.current = null;
      }
    };
  }, [activeTab, slideDone]);

  const panelClass = (tab) =>
    [
      'search-modal-browse-panel',
      `search-modal-browse-panel--${tab}`,
      slideDone && activeTab !== tab ? 'search-modal-browse-panel--collapsed' : '',
    ]
      .filter(Boolean)
      .join(' ');

  const selectTavsiya = () => selectTab('tavsiya');
  const selectHistory = () => selectTab('history');

  return (
    <div className="search-modal-browse">
      <div
        className="search-modal-browse-tabs"
        role="tablist"
        aria-label={t('searchModal.browseTabs', 'Qidiruv bo‘limlari')}
      >
        <button
          type="button"
          role="tab"
          id="search-browse-tab-tavsiya"
          aria-controls="search-browse-panel-tavsiya"
          aria-selected={activeTab === 'tavsiya'}
          className={`search-modal-browse-tab${
            activeTab === 'tavsiya' ? ' search-modal-browse-tab--active' : ''
          }`}
          onClick={selectTavsiya}
        >
          {t('searchModal.forYouTab', 'Siz uchun tavsiya')}
        </button>
        <button
          type="button"
          role="tab"
          id="search-browse-tab-history"
          aria-controls="search-browse-panel-history"
          aria-selected={activeTab === 'history'}
          className={`search-modal-browse-tab${
            activeTab === 'history' ? ' search-modal-browse-tab--active' : ''
          }`}
          onClick={selectHistory}
        >
          {t('searchModal.historyTab', 'Qidiruv tarixlari')}
        </button>
      </div>

      <div className="search-modal-browse-viewport">
        <div
          className={`search-modal-browse-track${
            activeTab === 'history' ? ' search-modal-browse-track--history' : ''
          }`}
        >
          <div
            id="search-browse-panel-tavsiya"
            className={panelClass('tavsiya')}
            role="tabpanel"
            aria-labelledby="search-browse-tab-tavsiya"
            aria-hidden={activeTab !== 'tavsiya'}
          >
            <SearchModalCategory onCategoryClick={close} />
            <SearchModalGenre onGenreClick={close} />
            <SearchModalAnons onAnonsClick={close} />
            <SearchModalTavsiya onMovieClick={close} />
          </div>

          <div
            id="search-browse-panel-history"
            className={panelClass('history')}
            role="tabpanel"
            aria-labelledby="search-browse-tab-history"
            aria-hidden={activeTab !== 'history'}
          >
            <SearchModalHistory
              enabled={activeTab === 'history'}
              onItemClick={close}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModalBrowseShell;
