import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { fetchSearchResults } from '../../api/searchApi';
import { OPEN_CHANNEL_SEARCH_EVENT } from '../../channelSearchBridge';
import ChanelSearchGenre from './ChanelSearchGenre';
import ChanelSearchTrend from './ChanelSearchTrend';
import './ChanelTypeFilter.css';

const MOBILE_SEARCH_MAX = 768;

const CHANNEL_TYPES = [
  { id: 'all', label: 'Hammasi' },
  { id: 'movies', label: 'Kinolar' },
  { id: 'music', label: 'Musiqa' },
  { id: 'klip', label: 'Klip' },
  { id: 'album', label: 'Albom' },
  { id: 'videos', label: 'Videolar' },
  { id: 'shorts', label: 'Shortslar' },
  { id: 'playlists', label: 'Playlistlar' },
  { id: 'posts', label: 'Postlar' },
];

const resultTitle = (item, lang) => {
  const title = item?.title;
  if (title && typeof title === 'object') return title[lang] || title.uz || title.ru || '';
  return String(title || '').trim();
};

const ChanelTypeFilter = ({
  value,
  onChange,
  channelId,
  genreId,
  onGenreChange,
  onTrendChange,
}) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const [internalValue, setInternalValue] = useState('all');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const selected = value ?? internalValue;

  const select = (id) => {
    if (value === undefined) setInternalValue(id);
    onGenreChange?.(null);
    onTrendChange?.(null);
    onChange?.(id);
  };

  const closeSearch = () => {
    setGenreOpen(false);
    setMobileOpen(false);
  };

  const chooseGenre = (genre) => {
    onTrendChange?.(null);
    onGenreChange?.(genreId === genre.id ? null : genre.id);
    closeSearch();
  };

  const showTrend = (ids) => {
    onGenreChange?.(null);
    onTrendChange?.(Array.isArray(ids) ? ids : []);
    closeSearch();
  };

  useEffect(() => {
    const open = () => {
      if (window.innerWidth > MOBILE_SEARCH_MAX) return;
      setMobileOpen((current) => !current);
    };
    const onResize = () => {
      if (window.innerWidth > MOBILE_SEARCH_MAX) setMobileOpen(false);
    };
    window.addEventListener(OPEN_CHANNEL_SEARCH_EVENT, open);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener(OPEN_CHANNEL_SEARCH_EVENT, open);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useLayoutEffect(() => {
    document.body.classList.toggle('channel-mobile-search-open', mobileOpen);
    return () => document.body.classList.remove('channel-mobile-search-open');
  }, [mobileOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || !channelId) {
      setResults(null);
      setSearching(false);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      fetchSearchResults(trimmed, contentLang, {
        channelId,
        channelType: 'all',
      })
        .then((data) => {
          if (!cancelled) setResults(data);
        })
        .catch(() => {
          if (!cancelled) setResults(null);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, channelId, contentLang]);

  const rows = [
    ...(results?.movies || []).map((item) => ({
      key: `movie-${item.id}`,
      kind: 'Kino',
      title: resultTitle(item, contentLang),
      to: `/movie/${item.id}`,
    })),
    ...(results?.music || []).map((item) => ({
      key: `music-${item.id}`,
      kind: 'Musiqa',
      title: resultTitle(item, contentLang),
      to: `/music/${item.id}`,
    })),
    ...(results?.shorts || []).map((item) => ({
      key: `short-${item.id}`,
      kind: 'Shorts',
      title: resultTitle(item, contentLang),
      to: `/shorts?shortId=${item.id}`,
    })),
  ].filter((row) => row.title);

  const showResults = query.trim().length >= 2;

  const browse = (
    <>
      <ChanelSearchGenre
        channelId={channelId}
        selectedId={genreId}
        onSelect={chooseGenre}
      />
      <ChanelSearchTrend channelId={channelId} onShowAll={showTrend} />
    </>
  );

  const resultList = (
    <div className="chanel-type-search-results" role="listbox">
      {searching ? <p className="chanel-type-search-empty">Qidirilmoqda</p> : null}
      {!searching && rows.length === 0 ? (
        <p className="chanel-type-search-empty">Topilmadi</p>
      ) : null}
      {!searching ? rows.map((row) => (
        <button
          key={row.key}
          type="button"
          role="option"
          className="chanel-type-search-row"
          onClick={() => navigate(row.to)}
        >
          <span className="chanel-type-search-kind">{row.kind}</span>
          <span className="chanel-type-search-title">{row.title}</span>
        </button>
      )) : null}
    </div>
  );

  return (
    <div className="chanel-type-bar">
      <ScrollTouch className="chanel-type-filter" role="tablist" aria-label="Kanal turlari">
        {CHANNEL_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            role="tab"
            aria-selected={selected === type.id}
            className={`chanel-type-filter-chip${selected === type.id ? ' is-active' : ''}`}
            onClick={() => select(type.id)}
          >
            {type.label}
          </button>
        ))}
      </ScrollTouch>
      <label className="chanel-type-search">
        <input
          type="text"
          aria-label="Qidirish"
          placeholder="Qidirish..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setGenreOpen(true)}
          onClick={() => setGenreOpen(true)}
          onBlur={() => setGenreOpen(false)}
        />
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        {genreOpen && !showResults ? (
          <div className="chanel-search-panel" onMouseDownCapture={(event) => event.preventDefault()}>
            {browse}
          </div>
        ) : null}
        {showResults ? resultList : null}
      </label>
      {mobileOpen ? createPortal(
        <label className="chanel-search-nav-field">
          <button type="button" className="chanel-search-nav-back" onClick={closeSearch} aria-label="Orqaga">
            <i className="fa-solid fa-angle-left" aria-hidden="true" />
          </button>
          <input
            type="text"
            aria-label="Qidirish"
            placeholder="Qidirish..."
            value={query}
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
          />
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        </label>,
        document.querySelector('.navbar.navbar--channel-profile .navbar-container') || document.body,
      ) : null}
      {mobileOpen ? createPortal(
        <div className="chanel-search-mobile">
          <div className="chanel-search-mobile-sheet">
            {showResults ? (
              <div className="chanel-search-mobile-results">{resultList}</div>
            ) : browse}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
};

export default ChanelTypeFilter;
