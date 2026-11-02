import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { fetchSearchResults } from '../../api/searchApi';
import ChanelSearchGenre from './ChanelSearchGenre';
import './ChanelTypeFilter.css';

const CHANNEL_TYPES = [
  { id: 'all', label: 'Hammasi' },
  { id: 'movies', label: 'Kinolar' },
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

const ChanelTypeFilter = ({ value, onChange, channelId, genreId, onGenreChange }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const [internalValue, setInternalValue] = useState('all');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const selected = value ?? internalValue;

  const select = (id) => {
    if (value === undefined) setInternalValue(id);
    onGenreChange?.(null);
    onChange?.(id);
  };

  const chooseGenre = (genre) => {
    onGenreChange?.(genreId === genre.id ? null : genre.id);
    setGenreOpen(false);
  };

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
          <ChanelSearchGenre
            channelId={channelId}
            selectedId={genreId}
            onSelect={chooseGenre}
          />
        ) : null}
        {showResults ? (
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
        ) : null}
      </label>
    </div>
  );
};

export default ChanelTypeFilter;
