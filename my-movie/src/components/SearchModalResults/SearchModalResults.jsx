import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useActorsApi } from '../../context/ActorsApiContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMusicApi } from '../../context/MusicApiContext';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import FilterSearchRezult from '../FilterSearchRezult/FilterSearchRezult';
import { searchContentByQuery } from '../../utils/searchMovies';
import {
  SEARCH_FILTER_ALL,
  getAvailableSearchFilters,
  isSearchSectionVisible,
} from '../../utils/searchFilterTypes';
import './SearchModalResults.css';
import '../../Music/SearchMusicResults/SearchMusicResults.css';

const SearchModalResults = ({ query, onMovieClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { allActors } = useActorsApi();
  const { allMovies } = useMoviesApi();
  const { allMusic, allAlbums, allClips, allConcerts, allArtists, getArtistById } = useMusicApi();
  const [activeFilter, setActiveFilter] = useState(SEARCH_FILTER_ALL);

  const results = searchContentByQuery(query, contentLang, 40, {
    actors: allActors,
    movies: allMovies,
    music: allMusic,
    albums: allAlbums,
    clips: allClips,
    concerts: allConcerts,
    musicArtists: allArtists,
  });

  const { actors, musicArtists, movies, music, albums, clips, concerts } = results;

  const availableFilters = useMemo(
    () =>
      getAvailableSearchFilters(results).map((filter) => ({
        id: filter.id,
        label: t(filter.labelKey, filter.labelDefault),
      })),
    [results, t]
  );

  useEffect(() => {
    setActiveFilter(SEARCH_FILTER_ALL);
  }, [query]);

  useEffect(() => {
    if (
      activeFilter !== SEARCH_FILTER_ALL &&
      !availableFilters.some((filter) => filter.id === activeFilter)
    ) {
      setActiveFilter(SEARCH_FILTER_ALL);
    }
  }, [activeFilter, availableFilters]);

  const show = (sectionId) => isSearchSectionVisible(activeFilter, sectionId);

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

  if (!query?.trim()) return null;

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
    </div>
  );
};

export default SearchModalResults;
