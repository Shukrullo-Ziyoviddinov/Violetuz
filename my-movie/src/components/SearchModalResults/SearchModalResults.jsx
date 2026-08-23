import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMusicApi } from '../../context/MusicApiContext';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import FilterSearchRezult from '../FilterSearchRezult/FilterSearchRezult';
import SearchLoader from '../SearchLoader/SearchLoader';
import { fetchSearchResults, cloneEmptyMetaSections } from '../../api/searchApi';
import {
  SEARCH_FILTER_ALL,
  getAvailableSearchFilters,
  isSearchSectionVisible,
} from '../../utils/searchFilterTypes';
import './SearchModalResults.css';
import '../../Music/SearchMusicResults/SearchMusicResults.css';

const SECTION_KEYS = [
  'actors',
  'musicArtists',
  'movies',
  'music',
  'albums',
  'clips',
  'concerts',
];

const mergeUniqueById = (prev = [], next = []) => {
  if (!next.length) return prev;
  const seen = new Set(prev.map((item) => String(item.id)));
  const merged = [...prev];
  for (const item of next) {
    const key = String(item?.id);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
};

const SearchModalResults = ({ query, onMovieClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { getArtistById } = useMusicApi();
  const [activeFilter, setActiveFilter] = useState(SEARCH_FILTER_ALL);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [accumulated, setAccumulated] = useState({
    actors: [],
    musicArtists: [],
    movies: [],
    music: [],
    albums: [],
    clips: [],
    concerts: [],
  });
  const [sectionsMeta, setSectionsMeta] = useState(() => cloneEmptyMetaSections());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreLockRef = useRef(false);
  const requestIdRef = useRef(0);
  const sentinelRef = useRef(null);

  const trimmedQuery = query?.trim() || '';

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(trimmedQuery), 300);
    return () => clearTimeout(timer);
  }, [trimmedQuery]);

  useEffect(() => {
    requestIdRef.current = debouncedQuery;
    setAccumulated({
      actors: [],
      musicArtists: [],
      movies: [],
      music: [],
      albums: [],
      clips: [],
      concerts: [],
    });
    setSectionsMeta(cloneEmptyMetaSections());
    setActiveFilter(SEARCH_FILTER_ALL);
    loadMoreLockRef.current = false;
    setIsLoadingMore(false);
  }, [debouncedQuery]);

  const {
    data: firstPage,
    isFetching,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ['search', debouncedQuery, contentLang],
    queryFn: () => fetchSearchResults(debouncedQuery, contentLang),
    enabled: debouncedQuery.length > 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isSuccess || !firstPage) return;
    if (requestIdRef.current !== debouncedQuery) return;
    setAccumulated({
      actors: firstPage.actors || [],
      musicArtists: firstPage.musicArtists || [],
      movies: firstPage.movies || [],
      music: firstPage.music || [],
      albums: firstPage.albums || [],
      clips: firstPage.clips || [],
      concerts: firstPage.concerts || [],
    });
    setSectionsMeta(firstPage.meta?.sections || cloneEmptyMetaSections());
  }, [isSuccess, firstPage, debouncedQuery]);

  const { actors, musicArtists, movies, music, albums, clips, concerts } = accumulated;

  const availableFilters = useMemo(
    () =>
      getAvailableSearchFilters(accumulated).map((filter) => ({
        id: filter.id,
        label: t(filter.labelKey, filter.labelDefault),
      })),
    [accumulated, t]
  );

  useEffect(() => {
    if (
      activeFilter !== SEARCH_FILTER_ALL &&
      !availableFilters.some((filter) => filter.id === activeFilter)
    ) {
      setActiveFilter(SEARCH_FILTER_ALL);
    }
  }, [activeFilter, availableFilters]);

  const show = (sectionId) => isSearchSectionVisible(activeFilter, sectionId);
  const isInitialLoading =
    trimmedQuery.length > 0 &&
    (trimmedQuery !== debouncedQuery || (isFetching && !firstPage));

  const getSectionsToLoadMore = useCallback(() => {
    const map = {
      actor: 'actors',
      movie: 'movies',
      music: 'music',
      artist: 'musicArtists',
      album: 'albums',
      klip: 'clips',
      konsert: 'concerts',
    };

    return SECTION_KEYS.filter((key) => {
      const meta = sectionsMeta?.[key];
      if (!meta?.hasMore || !meta.nextCursor) return false;
      if (activeFilter === SEARCH_FILTER_ALL) return true;
      const filterKey = Object.entries(map).find(([, section]) => section === key)?.[0];
      return filterKey ? isSearchSectionVisible(activeFilter, filterKey) : false;
    });
  }, [sectionsMeta, activeFilter]);

  const loadMore = useCallback(async () => {
    if (!debouncedQuery || loadMoreLockRef.current) return;
    const sections = getSectionsToLoadMore();
    if (!sections.length) return;

    const requestQuery = debouncedQuery;
    const requestLang = contentLang;
    const cursors = Object.fromEntries(
      sections.map((section) => [section, sectionsMeta[section]?.nextCursor])
    );

    loadMoreLockRef.current = true;
    setIsLoadingMore(true);
    try {
      const pages = await Promise.all(
        sections.map((section) =>
          fetchSearchResults(requestQuery, requestLang, {
            section,
            cursor: cursors[section],
          })
        )
      );

      // So'rov o'zgargan bo'lsa — eski javobni qo'shma
      if (requestIdRef.current !== requestQuery) return;

      setAccumulated((prev) => {
        const next = { ...prev };
        pages.forEach((page, index) => {
          const section = sections[index];
          next[section] = mergeUniqueById(prev[section], page[section] || []);
        });
        return next;
      });

      setSectionsMeta((prev) => {
        const next = { ...prev };
        pages.forEach((page, index) => {
          const section = sections[index];
          next[section] = page.meta?.sections?.[section] || {
            hasMore: false,
            nextCursor: null,
            total: next[section]?.total || 0,
          };
        });
        return next;
      });
    } catch {
      // keep existing results
    } finally {
      setIsLoadingMore(false);
      loadMoreLockRef.current = false;
    }
  }, [debouncedQuery, contentLang, getSectionsToLoadMore, sectionsMeta]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || isInitialLoading) return undefined;

    const scrollRoot =
      node.closest('.navbar-search-modal-inner') ||
      node.closest('.navbar-mobile-search-box') ||
      null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { root: scrollRoot, rootMargin: '160px', threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, isInitialLoading, debouncedQuery, sectionsMeta]);

  const getMovieTitle = (m) => {
    if (m?.title && typeof m.title === 'object') {
      return m.title[contentLang] || m.title.uz || m.title.ru;
    }
    return m?.title || '';
  };

  const getMovieImg = (m) => {
    if (m?.homeImg && typeof m.homeImg === 'object') {
      return m.homeImg[contentLang] || m.homeImg.uz || m.homeImg.ru;
    }
    return m?.homeImg || '';
  };

  const getMusicTitle = (item) => {
    if (item?.name && !item?.title) return item.name;
    if (!item?.title) return '';
    if (typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
    }
    return String(item.title);
  };

  const getMusicArtistName = (item) => {
    if (item?.artistId) {
      const artist = getArtistById(item.artistId);
      return artist?.name || item.artistId || '';
    }
    return item?.artist || '';
  };

  const closeAndNavigate = (path) => {
    if (onMovieClick) onMovieClick();
    navigate(path);
  };

  const handleMovieClick = (movie) => closeAndNavigate(`/movie/${movie.id}`);
  const handleActorClick = (actor) => closeAndNavigate(`/actor/${actor.id}`);

  const handleMusicClick = (item, type) => {
    if (type === 'artist') {
      closeAndNavigate(`/music/artist/${item.id}`);
    } else if (type === 'album') {
      closeAndNavigate(`/music/album/${item.id}`);
    } else if (type === 'klip' || type === 'konsert') {
      closeAndNavigate(`/music/video/${item.id}`);
    } else {
      closeAndNavigate(`/music/${item.id}`);
    }
  };

  const getActorName = (actor) => {
    for (const lang of [contentLang, 'uz', 'ru']) {
      const v = actor?.name?.[lang];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return '';
  };

  if (!trimmedQuery) return null;

  if (isInitialLoading) {
    return <SearchLoader />;
  }

  const musicSections = [
    { key: 'music', items: music, label: t('music.searchTypeMusic', 'Musiqa') },
    { key: 'artist', items: musicArtists, label: t('music.searchTypeArtist', 'Artistlar') },
    { key: 'album', items: albums, label: t('music.searchTypeAlbum', 'Albom') },
    { key: 'klip', items: clips, label: t('music.searchTypeClip', 'Klip') },
    { key: 'konsert', items: concerts, label: t('music.searchTypeConcert', 'Konsert') },
  ];

  const hasAny =
    actors.length > 0 ||
    movies.length > 0 ||
    musicSections.some((s) => s.items.length > 0);

  const hasMoreAny = getSectionsToLoadMore().length > 0;

  if (isError && !hasAny) {
    return (
      <p className="search-modal-results-empty">
        {t('searchModal.error', 'Qidiruvda xatolik yuz berdi')}
      </p>
    );
  }

  return (
    <div className="search-modal-results">
      {hasAny && (
        <FilterSearchRezult
          filters={availableFilters}
          activeFilter={activeFilter}
          onSelect={setActiveFilter}
        />
      )}

      {show('actor') && actors.length > 0 && (
        <div className="search-modal-results-actors-block">
          <h3 className="search-modal-results-section-title">
            {t('searchModal.actorsSection', 'Aktyor')}
          </h3>
          <ScrollTouch className="search-modal-results-actors-scroll">
            <div className="search-modal-results-actors-row">
              {actors.map((actor) => (
                <div
                  key={`actor-${actor.id}`}
                  className="search-modal-results-actor-card"
                  onClick={() => handleActorClick(actor)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleActorClick(actor)}
                >
                  <div className="search-modal-results-actor-avatar-wrap">
                    <img
                      src={actor.image}
                      alt={getActorName(actor)}
                      className="search-modal-results-actor-avatar"
                    />
                  </div>
                  {getActorName(actor) && (
                    <p className="search-modal-results-actor-name">{getActorName(actor)}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollTouch>
        </div>
      )}

      {show('movie') && movies.length > 0 && (
        <div
          className={`search-modal-results-movies-block${show('actor') && actors.length > 0 ? ' search-modal-results-movies-block--after-actors' : ''}`}
        >
          <h3 className="search-modal-results-section-title">
            {t('searchModal.moviesSection', 'Kinolar')}
          </h3>
          <div className="search-modal-results-grid">
            {movies.map((movie) => (
              <div
                key={`movie-${movie.id}`}
                className="search-modal-results-item"
                onClick={() => handleMovieClick(movie)}
              >
                <div className="search-modal-results-item-image-wrapper">
                  <img
                    src={getMovieImg(movie)}
                    alt={getMovieTitle(movie)}
                    className="search-modal-results-item-image"
                  />
                  {movie.category === 'anonslar' && (
                    <span className="search-modal-results-badge search-modal-results-badge-soon">
                      {t('searchModal.tezOrada', 'Tez orada')}
                    </span>
                  )}
                  {movie.ageRestriction != null && (
                    <span className="search-modal-results-badge search-modal-results-badge-age">
                      {movie.ageRestriction}+
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="search-music-results">
        {musicSections.map(({ key, items, label }) => {
          if (!show(key) || items.length === 0) return null;
          const isVideo = key === 'klip' || key === 'konsert';
          return (
            <div key={key} className="search-music-results-section">
              <h4 className="search-music-results-section-title">{label}</h4>
              {key === 'artist' ? (
                <ScrollTouch className="search-music-results-scroll">
                  <div className="search-music-results-horizontal">
                    {items.map((item) => (
                      <div
                        key={`artist-${item.id}`}
                        className="search-music-results-item search-music-results-item--artist"
                        onClick={() => handleMusicClick(item, 'artist')}
                      >
                        <div className="search-music-results-item-image-wrapper">
                          <img
                            src={(item.imgArtist || item.img) || '/img/movie1.jpg'}
                            alt={getMusicTitle(item)}
                            className="search-music-results-item-image"
                          />
                        </div>
                        <div className="search-music-results-item-info">
                          <span className="search-music-results-item-title">{getMusicTitle(item)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollTouch>
              ) : isVideo ? (
                <ScrollTouch className="search-music-results-scroll">
                  <div className="search-music-results-horizontal">
                    {items.map((item) => (
                      <div
                        key={`${key}-${item.id}`}
                        className="search-music-results-item search-music-results-item--video"
                        onClick={() => handleMusicClick(item, key)}
                      >
                        <div className="search-music-results-item-image-wrapper">
                          <img
                            src={item.imgArtist || item.img || '/img/movie1.jpg'}
                            alt={getMusicTitle(item)}
                            className="search-music-results-item-image"
                          />
                          <div className="search-music-results-item-info">
                            <span className="search-music-results-item-title">{getMusicTitle(item)}</span>
                            <span className="search-music-results-item-artist">{getMusicArtistName(item)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollTouch>
              ) : (
                <div className="search-music-results-grid">
                  {items.map((item) => (
                    <div
                      key={`${key}-${item.id}`}
                      className="search-music-results-item"
                      onClick={() => handleMusicClick(item, key)}
                    >
                      <div className="search-music-results-item-image-wrapper">
                        <img
                          src={item.img || '/img/movie1.jpg'}
                          alt={getMusicTitle(item)}
                          className="search-music-results-item-image"
                        />
                        <div className="search-music-results-item-info">
                          <span className="search-music-results-item-title">{getMusicTitle(item)}</span>
                          <span className="search-music-results-item-artist">{getMusicArtistName(item)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasAny && (
        <p className="search-modal-results-empty">{t('searchModal.noResults', 'Natija topilmadi')}</p>
      )}

      {(hasMoreAny || isLoadingMore) && (
        <div
          ref={sentinelRef}
          className="search-modal-results-load-more"
          aria-hidden={!isLoadingMore}
        >
          {isLoadingMore && <SearchLoader />}
        </div>
      )}
    </div>
  );
};

export default SearchModalResults;
