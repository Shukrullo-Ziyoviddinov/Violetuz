import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { fetchSearchResults } from '../../api/searchApi';
import { OPEN_CHANNEL_SEARCH_EVENT } from '../../channelSearchBridge';
import ChanelSearchGenre from './ChanelSearchGenre';
import ChanelSearchTrend from './ChanelSearchTrend';
import ChanelSearchTavsiya from './ChanelSearchTavsiya';
import ChanelSearchForYou from './ChanelSearchForYou';
import ChanelSearchMovieResults from './ChanelSearchMovieResults';
import SearchShortsCard from '../SearchShorts/SearchShortsCard';
import './ChanelTypeFilter.css';

const MOBILE_SEARCH_MAX = 768;

const CHANNEL_TYPES = [
  { id: 'all', fallback: 'Hammasi' },
  { id: 'movies', fallback: 'Kinolar' },
  { id: 'trailers', fallback: 'Treylerlar' },
  { id: 'music', fallback: 'Musiqa' },
  { id: 'klip', fallback: 'Klip' },
  { id: 'album', fallback: 'Albom' },
  { id: 'konsert', fallback: 'Konsertlar' },
  { id: 'videos', fallback: 'Videolar' },
  { id: 'shorts', fallback: 'Shortslar' },
  { id: 'playlists', fallback: 'Playlistlar' },
  { id: 'posts', fallback: 'Postlar' },
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
  onMusicForYouChange,
}) => {
  const { t } = useTranslation();
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
    onMusicForYouChange?.(null);
    onChange?.(id);
  };

  const closeSearch = () => {
    setGenreOpen(false);
    setMobileOpen(false);
  };

  const chooseGenre = (genre) => {
    onTrendChange?.(null);
    onMusicForYouChange?.(null);
    onGenreChange?.(genreId === genre.id ? null : genre.id);
    closeSearch();
  };

  const showTrend = (ids) => {
    onGenreChange?.(null);
    onMusicForYouChange?.(null);
    onTrendChange?.(Array.isArray(ids) ? ids : []);
    closeSearch();
  };

  const showMusicForYou = (ids) => {
    onGenreChange?.(null);
    onTrendChange?.(null);
    onMusicForYouChange?.(Array.isArray(ids) ? ids : []);
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

  const movies = Array.isArray(results?.movies) ? results.movies : [];
  const shorts = Array.isArray(results?.shorts) ? results.shorts : [];
  const rows = [
    ...(results?.music || []).map((item) => ({
      key: `music-${item.id}`,
      kind: 'Musiqa',
      title: resultTitle(item, contentLang),
      to: `/music/${item.id}`,
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
      <ChanelSearchForYou
        channelId={channelId}
        onOpen={closeSearch}
        onShowAll={showMusicForYou}
      />
      <ChanelSearchTavsiya channelId={channelId} onOpen={closeSearch} />
    </>
  );

  const openMovie = (movie) => {
    if (movie?.id == null) return;
    closeSearch();
    navigate(`/movie/${movie.id}`);
  };

  const openShort = (item) => {
    if (item?.id == null) return;
    const playlist = shorts
      .filter((row) => row?.id != null && (row.type === 'movieShorts' || row.type === 'musicshorts'))
      .map((row) => `${row.type}:${row.id}`)
      .join(',');
    const params = new URLSearchParams();
    params.set('shortId', String(item.id));
    if (item.type) params.set('shortsType', String(item.type));
    if (playlist) params.set('searchShorts', playlist);
    closeSearch();
    navigate(`/shorts?${params.toString()}`);
  };

  const wideResults = movies.length > 0 || shorts.length > 0;

  const resultList = (
    <div
      className={`chanel-type-search-results${wideResults ? ' chanel-type-search-results--movies' : ''}`}
      role="listbox"
    >
      {searching ? <p className="chanel-type-search-empty">Qidirilmoqda</p> : null}
      {!searching && movies.length === 0 && rows.length === 0 && shorts.length === 0 ? (
        <p className="chanel-type-search-empty">Topilmadi</p>
      ) : null}
      {!searching && movies.length > 0 ? (
        <ChanelSearchMovieResults movies={movies} onOpen={openMovie} />
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
      {!searching && shorts.length > 0 ? (
        <div className="search-shorts-row">
          <h3 className="search-shorts-row-title">
            {t('searchModal.shortsSection', 'Shortslar')}
          </h3>
          <ScrollTouch className="search-music-results-scroll">
            <div className="search-shorts-row-track">
              {shorts.map((item) => (
                <SearchShortsCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onOpen={openShort}
                />
              ))}
            </div>
          </ScrollTouch>
        </div>
      ) : null}
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
            {t(`channel.filters.${type.id}`, type.fallback)}
          </button>
        ))}
      </ScrollTouch>
      <label className="chanel-type-search">
        <input
          type="text"
          aria-label={t('navbar.search', 'Qidirish...')}
          placeholder={t('navbar.search', 'Qidirish...')}
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
            aria-label={t('navbar.search', 'Qidirish...')}
            placeholder={t('navbar.search', 'Qidirish...')}
            value={query}
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
          />
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        </label>,
        (document.body.classList.contains('channel-mobile-profile')
          ? document.querySelector('.channel-profile-back')
          : document.querySelector('.navbar.navbar--channel-profile .navbar-container'))
          || document.body,
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
