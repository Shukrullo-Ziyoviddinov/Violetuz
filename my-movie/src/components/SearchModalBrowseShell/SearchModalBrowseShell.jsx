import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchModalGenre from '../SearchModalGenre/SearchModalGenre';
import SearchModalAnons from '../SearchModalAnons/SearchModalAnons';
import SearchModalTavsiya from '../SearchModalTavsiya/SearchModalTavsiya';
import SearchModalCategory from '../../Music/SearchMusicResults/SearchModalCategory';
import './SearchModalBrowseShell.css';

const SLIDE_MS = 380;

/**
 * Browse: Kino | Music + slide carousel.
 * Kino: Genre + Anons + Tavsiya (Category yo‘q).
 * Music: SearchModalCategory (+ keyin music tavsiya).
 * History bu shellda emas — compose rejimida SearchModalIdleBody orqali.
 * Default tab: kino. Music → panel o‘ngga; Kino → chapga.
 */
const SearchModalBrowseShell = ({ onNavigateAway }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('kino');
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

  const selectKino = () => selectTab('kino');
  const selectMusic = () => selectTab('music');
  const isMusic = activeTab === 'music';

  return (
    <div className="search-modal-browse">
      <div
        className={`search-modal-browse-tabs${
          isMusic ? ' search-modal-browse-tabs--music' : ''
        }`}
        role="tablist"
        aria-label={t('searchModal.browseTabs', 'Qidiruv bo‘limlari')}
      >
        <span className="search-modal-browse-tabs-indicator" aria-hidden="true" />
        <button
          type="button"
          role="tab"
          id="search-browse-tab-kino"
          aria-controls="search-browse-panel-kino"
          aria-selected={activeTab === 'kino'}
          className={`search-modal-browse-tab${
            activeTab === 'kino' ? ' search-modal-browse-tab--active' : ''
          }`}
          onClick={selectKino}
        >
          {t('searchModal.kinoTab', 'Kino')}
        </button>
        <button
          type="button"
          role="tab"
          id="search-browse-tab-music"
          aria-controls="search-browse-panel-music"
          aria-selected={activeTab === 'music'}
          className={`search-modal-browse-tab${
            activeTab === 'music' ? ' search-modal-browse-tab--active' : ''
          }`}
          onClick={selectMusic}
        >
          {t('searchModal.musicTab', 'Musiqa')}
        </button>
      </div>

      <div className="search-modal-browse-viewport">
        {/* Tartib: music | kino — Musicga o‘tganda track o‘ngga (0 ← -50%) */}
        <div
          className={`search-modal-browse-track${
            isMusic ? '' : ' search-modal-browse-track--kino'
          }`}
        >
          <div
            id="search-browse-panel-music"
            className={panelClass('music')}
            role="tabpanel"
            aria-labelledby="search-browse-tab-music"
            aria-hidden={activeTab !== 'music'}
          >
            <SearchModalCategory onCategoryClick={close} />
          </div>

          <div
            id="search-browse-panel-kino"
            className={panelClass('kino')}
            role="tabpanel"
            aria-labelledby="search-browse-tab-kino"
            aria-hidden={activeTab !== 'kino'}
          >
            <SearchModalGenre onGenreClick={close} />
            <SearchModalAnons onAnonsClick={close} />
            <SearchModalTavsiya onMovieClick={close} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModalBrowseShell;
