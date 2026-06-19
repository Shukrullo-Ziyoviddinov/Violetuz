import React, { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../context/ContentLanguageContext';
import { artists } from '../dataMusic/artists';
import { allMovies } from '../data/movies';
import { allMusicData } from '../dataMusic/allMusicData';
import { artistMusicStory } from '../dataMusic/artistMusicStory';
import { allAlbums, allClipsData, allConcertsData } from '../dataMusic/wishlistDataConfig';
import { musicShorts } from '../dataMusic/musicShorts';
import FollowingButton from '../Music/FollowingButton/FollowingButton';
import HorizontalScroll from '../components/HorizontalScroll/HorizontalScroll';
import ImgModal from '../components/ImgModal/ImgModal';
import ScrollTouch from '../components/ScrollTouch/ScrollTouch';
import MoreText from '../components/MoreText/MoreText';
import ArtistMusicStory from '../Music/ArtistMusicStory/ArtistMusicStory';
import ArtistDetailElementFilter, { FILTER_ALL, FILTER_MUSIC, FILTER_ALBUM, FILTER_KLIP, FILTER_SHORTS, FILTER_KONSERT, FILTER_MOVIES } from '../Music/ArtistDetailElementFilter/ArtistDetailElementFilter';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useWishlist } from '../context/WishlistContext';
import { getDominantColor } from '../utils/dominantColor';
import { formatCount } from '../utils/utils';
import '../Music/MusicCards/MusicCards.css';
import '../Music/ClipsCards/ClipsCards.css';
import '../components/Movies/Movies.css';
import './ArtistDetail.css';

const getShortTitle = (item, lang) => item?.title?.[lang] || item?.title?.uz || '';
const getShortVideo = (item, lang) => item?.video?.[lang] || item?.video?.uz || '';

const ArtistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { loadAndPlayTrack, togglePlay, currentMusic, isPlaying } = useMusicPlayer();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [playingTrackColor, setPlayingTrackColor] = useState(null);
  const [artistHeaderColor, setArtistHeaderColor] = useState(null);
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [imgModalIndex, setImgModalIndex] = useState(0);
  const bioSectionRef = useRef(null);
  const [bioLineClamp, setBioLineClamp] = useState(3);

  const artist = artists.find((a) => a.id === id);

  useLayoutEffect(() => {
    const el = bioSectionRef.current;
    if (!el || !getBio(artist?.bio).text) return;
    const bio = getBio(artist?.bio);
    const hasBioImg = Array.isArray(bio.bioImg) ? bio.bioImg.length > 0 : !!bio.bioImg;

    const update = () => {
      const moreTextEl = el.querySelector('.more-text, .artist-detail-bio-text');
      const lineHeightPx = 16 * 1.6; // 1rem * line-height 1.6
      const reservedByHeight = hasBioImg ? 100 : 40; // "Yana" tugmasi + bioImg qatori

      let lines = 6; // fallback

      if (moreTextEl && moreTextEl.clientHeight > 0) {
        const availableH = Math.max(0, moreTextEl.clientHeight - reservedByHeight);
        lines = Math.floor(availableH / lineHeightPx);
      }
      const clamp = Math.max(3, Math.min(11, lines));
      setBioLineClamp(clamp);
    };
    update();
    requestAnimationFrame(update); // .more-text render bo‘lgach qayta hisoblash
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const onResize = () => update();
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [artist?.bio]);

  const artistTracks = allMusicData.filter((tr) => tr.artistId === id);
  const artistStories = artistMusicStory.filter((s) => s.artistId === id);
  const artistAlbums = allAlbums.filter((a) => a.artistId === id);
  const artistClips = allClipsData.filter((clip) => clip.artistId === id);
  const artistShorts = musicShorts.filter((s) => s.artistId === id);
  const artistConcerts = allConcertsData.filter((clip) => clip.artistId === id);
  const artistMovies = useMemo(
    () => allMovies.filter(
      (movie) => Array.isArray(movie?.actors) && movie.actors.some((castId) => String(castId) === String(id)),
    ),
    [id],
  );

  useEffect(() => {
    if (!artist?.img) {
      setArtistHeaderColor(null);
      return;
    }
    getDominantColor(artist.img).then((color) => setArtistHeaderColor(color));
  }, [artist?.img]);

  useEffect(() => {
    const isTrackFromThisArtist = currentMusic?.artistId === id;
    if (!isTrackFromThisArtist || !currentMusic) {
      setPlayingTrackColor(null);
      return;
    }
    const imgUrl = currentMusic.img || artist?.img || '/img/movie1.jpg';
    getDominantColor(imgUrl).then((color) => setPlayingTrackColor(color));
  }, [currentMusic?.id, currentMusic?.artistId, currentMusic?.img, id, artist?.img]);

  const chunkedTracks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < artistTracks.length; i += 4) {
      chunks.push(artistTracks.slice(i, i + 4));
    }
    return chunks;
  }, [artistTracks]);

  const handleTrackClick = (track) => {
    const isCurrentTrack = currentMusic?.id === track.id;
    if (isCurrentTrack && isPlaying) {
      togglePlay();
    } else if (isCurrentTrack && !isPlaying) {
      togglePlay();
    } else {
      loadAndPlayTrack(track.id, { autoplay: true, playlist: artistTracks });
    }
  };

  const getTitle = (item) => {
    return typeof item?.title === 'string' ? item.title : (item?.title?.uz || item?.title?.ru || item?.title?.en || '');
  };

  const getBio = (bio) => {
    if (!bio) return { text: '', bioImg: null };
    if (typeof bio === 'string') return { text: bio, bioImg: null };
    return { text: bio.text || bio.uz || bio.ru || '', bioImg: bio.bioImg || null };
  };

  const getMovieTitle = (movie) => {
    if (!movie?.title) return '';
    if (typeof movie.title === 'string') return movie.title;
    return movie.title[contentLang] || movie.title.uz || movie.title.ru || '';
  };

  const getMovieImage = (movie) => {
    if (!movie?.homeImg) return '/img/movie1.jpg';
    if (typeof movie.homeImg === 'string') return movie.homeImg;
    return movie.homeImg[contentLang] || movie.homeImg.uz || movie.homeImg.ru || '/img/movie1.jpg';
  };

  if (!artist) {
    return (
      <div className="artist-detail">
        <div className="artist-detail-container">
          <div className="artist-detail-error">Ijrochi topilmadi</div>
        </div>
      </div>
    );
  }

  return (
    <div className="artist-detail">
      <div className="artist-detail-container">
        <div
          className={`artist-detail-header${artistHeaderColor ? ' artist-detail-header--has-color' : ''}`}
          style={artistHeaderColor ? {
            '--header-r': artistHeaderColor.r,
            '--header-g': artistHeaderColor.g,
            '--header-b': artistHeaderColor.b,
          } : undefined}
        >
          <div className="artist-detail-img-wrap">
            <img
              src={artist.img || '/img/movie1.jpg'}
              alt={artist.name}
              className="artist-detail-img"
            />
            <div className="artist-detail-caption">
              <h1 className="artist-detail-name">
                {artist.name}
                <img src="/img/galichka.png" alt="" className="artist-detail-name-verified" aria-hidden />
              </h1>
              {artist.description && (
                <p className="artist-detail-description">{artist.description}</p>
              )}
              {(artist.birthDate || artist.country || artist.city || (artist.genres?.length > 0)) && (
                <ScrollTouch className="artist-detail-info">
                  {artist.birthDate && (
                    <div className="artist-detail-info-item">
                      <span className="artist-detail-info-icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </span>
                      <span className="artist-detail-info-value">{new Date(artist.birthDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                  {artist.country && (
                    <div className="artist-detail-info-item">
                      <span className="artist-detail-info-icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </span>
                      <span className="artist-detail-info-value">{artist.country}</span>
                    </div>
                  )}
                  {artist.city && (
                    <div className="artist-detail-info-item">
                      <span className="artist-detail-info-icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </span>
                      <span className="artist-detail-info-value">{artist.city}</span>
                    </div>
                  )}
                  {artist.genres?.length > 0 && (
                    <div className="artist-detail-info-item">
                      <span className="artist-detail-info-icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                      </span>
                      <span className="artist-detail-info-value">{artist.genres.join(', ')}</span>
                    </div>
                  )}
                </ScrollTouch>
              )}
            </div>
          </div>
          <div className="artist-detail-stats">
            <ScrollTouch className="artist-detail-stats-items">
              <div className="artist-detail-stat-item">
                <span className="artist-detail-track-num">{artistTracks.length}</span>
                <span className="artist-detail-track-label">{t('music.tracks', 'Musiqa')}</span>
              </div>
              <div className="artist-detail-stat-item">
                <span className="artist-detail-track-num">{artistAlbums.length}</span>
                <span className="artist-detail-track-label">{t('music.albums', 'Albomlar')}</span>
              </div>
              <div className="artist-detail-stat-item">
                <span className="artist-detail-track-num">{artistClips.length}</span>
                <span className="artist-detail-track-label">{t('music.clips', 'Kliplar')}</span>
              </div>
              <div className="artist-detail-stat-item">
                <span className="artist-detail-track-num">{artistShorts.length}</span>
                <span className="artist-detail-track-label">{t('music.shorts', 'Shorts')}</span>
              </div>
              <div className="artist-detail-stat-item">
                <span className="artist-detail-track-num">{artistConcerts.length}</span>
                <span className="artist-detail-track-label">{t('music.concerts', 'Konsertlar')}</span>
              </div>
              <div className="artist-detail-stat-item">
                <span className="artist-detail-track-num" data-subscriber-count>
                  {formatCount(artist.subscribers ?? 0)}
                </span>
                <span className="artist-detail-track-label">Obuna</span>
              </div>
            </ScrollTouch>
            <div className="artist-detail-stats-follow">
              <FollowingButton
                artistId={artist.id}
                onSubscribeChange={(isSubscribed) => {
                  const el = document.querySelector('[data-subscriber-count]');
                  if (el) {
                    const base = (artist.subscribers ?? 0) + (isSubscribed ? 1 : 0);
                    el.textContent = formatCount(base);
                  }
                }}
              />
            </div>
          </div>
          <ArtistMusicStory stories={artistStories} />
        </div>
        {(getBio(artist.bio).text || artist.photoGallery?.length > 0) && (
          <div className={`artist-detail-bio-gallery${getBio(artist.bio).text && artist.photoGallery?.length ? '' : ' artist-detail-bio-gallery--single'}`}>
            {getBio(artist.bio).text && (
              <div ref={bioSectionRef} className="artist-detail-bio-section">
                <h3 className="artist-detail-bio-title">Biography</h3>
                <MoreText text={getBio(artist.bio).text} bioImg={getBio(artist.bio).bioImg} lineClamp={bioLineClamp} modalTitle="Biography" className="artist-detail-bio-text" />
              </div>
            )}
            {artist.photoGallery?.length > 0 && (
              <div className="artist-detail-gallery-section">
                <h3 className="artist-detail-gallery-title">Photo & Gallery</h3>
                <div className="artist-detail-gallery-grid">
                  <div className="artist-detail-gallery-cell artist-detail-gallery-cell--tall" onClick={() => { setImgModalIndex(0); setImgModalOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && (setImgModalIndex(0), setImgModalOpen(true))}>
                    <img src={artist.photoGallery[0] || '/img/movie1.jpg'} alt="" />
                  </div>
                  <div className="artist-detail-gallery-cell" onClick={() => { setImgModalIndex(1); setImgModalOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && (setImgModalIndex(1), setImgModalOpen(true))}>
                    <img src={artist.photoGallery[1] || '/img/movie1.jpg'} alt="" />
                  </div>
                  <div className="artist-detail-gallery-cell" onClick={() => { setImgModalIndex(2); setImgModalOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && (setImgModalIndex(2), setImgModalOpen(true))}>
                    <img src={artist.photoGallery[2] || '/img/movie1.jpg'} alt="" />
                  </div>
                  <div className="artist-detail-gallery-cell" onClick={() => { setImgModalIndex(3); setImgModalOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && (setImgModalIndex(3), setImgModalOpen(true))}>
                    <img src={artist.photoGallery[3] || '/img/movie1.jpg'} alt="" />
                  </div>
                  <div className="artist-detail-gallery-cell" onClick={() => { setImgModalIndex(4); setImgModalOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && (setImgModalIndex(4), setImgModalOpen(true))}>
                    <img src={artist.photoGallery[4] || '/img/movie1.jpg'} alt="" />
                  </div>
                </div>
                <ImgModal
                  isOpen={imgModalOpen}
                  onClose={() => setImgModalOpen(false)}
                  images={artist.photoGallery}
                  currentIndex={imgModalIndex}
                  onIndexChange={setImgModalIndex}
                />
              </div>
            )}
          </div>
        )}
        {(artistTracks.length > 0 || artistAlbums.length > 0 || artistClips.length > 0 || artistShorts.length > 0 || artistConcerts.length > 0 || artistMovies.length > 0) && (
          <ArtistDetailElementFilter
            hasMusic={artistTracks.length > 0}
            hasAlbums={artistAlbums.length > 0}
            hasClips={artistClips.length > 0}
            hasShorts={artistShorts.length > 0}
            hasConcerts={artistConcerts.length > 0}
            hasMovies={artistMovies.length > 0}
            value={activeFilter}
            onChange={setActiveFilter}
          />
        )}
        {(activeFilter === FILTER_ALL || activeFilter === FILTER_MUSIC) && artistTracks.length > 0 && (
        <div className={`artist-detail-tracks-wrap${activeFilter !== FILTER_ALL ? ' artist-detail-section--filtered' : ''}`}>
          <h3 className="artist-detail-tracks-title">{t('music.tracks', 'Musiqalar')}</h3>
          {activeFilter === FILTER_ALL ? (
          <HorizontalScroll scrollAmount={280}>
            {chunkedTracks.map((column, colIndex) => {
              return (
              <div key={colIndex} className="artist-detail-tracks-column">
                {column.map((track) => (
                  <div
                    key={track.id}
                    className={`artist-detail-track${currentMusic?.id === track.id ? ' artist-detail-track--playing' : ''}${currentMusic?.id === track.id && isPlaying ? ' artist-detail-track--spinning' : ''}`}
                    style={currentMusic?.id === track.id && playingTrackColor ? {
                      background: `rgba(${playingTrackColor.r}, ${playingTrackColor.g}, ${playingTrackColor.b}, 0.35)`,
                      boxShadow: `0 0 20px rgba(${playingTrackColor.r}, ${playingTrackColor.g}, ${playingTrackColor.b}, 0.3)`,
                    } : undefined}
                    onClick={() => handleTrackClick(track)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrackClick(track)}
                    aria-label={`${getTitle(track)} - ${currentMusic?.id === track.id && isPlaying ? 'Pauza' : 'Ijro etish'}`}
                  >
                    <div className="artist-detail-track-img-wrap">
                      <img
                        src={track.img || artist.img || '/img/movie1.jpg'}
                        alt={getTitle(track)}
                        className="artist-detail-track-img"
                      />
                    </div>
                    <div className="artist-detail-track-info">
                      <span className="artist-detail-track-name">{artist.name}</span>
                      <span className="artist-detail-track-title">{getTitle(track)}</span>
                    </div>
                    <button
                      type="button"
                      className="artist-detail-play-btn"
                      onClick={(e) => { e.stopPropagation(); handleTrackClick(track); }}
                      aria-label={currentMusic?.id === track.id && isPlaying ? 'Pauza' : 'Ijro etish'}
                    >
                      {(currentMusic?.id === track.id && isPlaying) ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
          </HorizontalScroll>
          ) : (
          <div className="artist-detail-tracks-grid">
            {artistTracks.map((track) => (
              <div
                key={track.id}
                className={`artist-detail-track${currentMusic?.id === track.id ? ' artist-detail-track--playing' : ''}${currentMusic?.id === track.id && isPlaying ? ' artist-detail-track--spinning' : ''}`}
                style={currentMusic?.id === track.id && playingTrackColor ? {
                  background: `rgba(${playingTrackColor.r}, ${playingTrackColor.g}, ${playingTrackColor.b}, 0.35)`,
                  boxShadow: `0 0 20px rgba(${playingTrackColor.r}, ${playingTrackColor.g}, ${playingTrackColor.b}, 0.3)`,
                } : undefined}
                onClick={() => handleTrackClick(track)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleTrackClick(track)}
                aria-label={`${getTitle(track)} - ${currentMusic?.id === track.id && isPlaying ? 'Pauza' : 'Ijro etish'}`}
              >
                <div className="artist-detail-track-img-wrap">
                  <img
                    src={track.img || artist.img || '/img/movie1.jpg'}
                    alt={getTitle(track)}
                    className="artist-detail-track-img"
                  />
                </div>
                <div className="artist-detail-track-info">
                  <span className="artist-detail-track-name">{artist.name}</span>
                  <span className="artist-detail-track-title">{getTitle(track)}</span>
                </div>
                <button
                  type="button"
                  className="artist-detail-play-btn"
                  onClick={(e) => { e.stopPropagation(); handleTrackClick(track); }}
                  aria-label={currentMusic?.id === track.id && isPlaying ? 'Pauza' : 'Ijro etish'}
                >
                  {(currentMusic?.id === track.id && isPlaying) ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
          )}
        </div>
        )}
        {(activeFilter === FILTER_ALL || activeFilter === FILTER_ALBUM) && artistAlbums.length > 0 && (
          <div className={`artist-detail-albums-wrap${activeFilter !== FILTER_ALL ? ' artist-detail-section--filtered' : ''}`}>
            <h3 className="artist-detail-albums-title">{t('music.albums', 'Albomlar')}</h3>
            {activeFilter === FILTER_ALL ? (
            <HorizontalScroll scrollAmount={220}>
              {artistAlbums.map((album) => (
                <div
                  key={album.id}
                  className="music-cards-item"
                  onClick={() => navigate(`/music/album/${album.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/music/album/${album.id}`)}
                  aria-label={`${album.title} - ${artist.name}`}
                >
                  <div className="music-cards-item-image-wrapper">
                    <img
                      src={album.img || '/img/movie1.jpg'}
                      alt={album.title}
                      className="music-cards-item-image"
                    />
                    <button
                      type="button"
                      className={`music-cards-item-wishlist-btn ${isInWishlist(album.id, 'album') ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(album.id, 'album'); }}
                      aria-label={isInWishlist(album.id, 'album') ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(album.id, 'album') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <div className="music-cards-item-play">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                    <div className="music-cards-item-info">
                      <h3 className="music-cards-item-title">{album.title}</h3>
                      <p className="music-cards-item-artist">{album.artist}</p>
                    </div>
                  </div>
                </div>
              ))}
            </HorizontalScroll>
            ) : (
            <div className="artist-detail-albums-grid">
              {artistAlbums.map((album) => (
                <div
                  key={album.id}
                  className="music-cards-item"
                  onClick={() => navigate(`/music/album/${album.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/music/album/${album.id}`)}
                  aria-label={`${album.title} - ${artist.name}`}
                >
                  <div className="music-cards-item-image-wrapper">
                    <img
                      src={album.img || '/img/movie1.jpg'}
                      alt={album.title}
                      className="music-cards-item-image"
                    />
                    <button
                      type="button"
                      className={`music-cards-item-wishlist-btn ${isInWishlist(album.id, 'album') ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(album.id, 'album'); }}
                      aria-label={isInWishlist(album.id, 'album') ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(album.id, 'album') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <div className="music-cards-item-play">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                    <div className="music-cards-item-info">
                      <h3 className="music-cards-item-title">{album.title}</h3>
                      <p className="music-cards-item-artist">{album.artist}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}
        {(activeFilter === FILTER_ALL || activeFilter === FILTER_KLIP) && artistClips.length > 0 && (
          <div className={`artist-detail-clips-wrap clips-cards${activeFilter !== FILTER_ALL ? ' artist-detail-section--filtered' : ''}`}>
            <h3 className="artist-detail-clips-title">{t('music.clips', 'Kliplar')}</h3>
            {activeFilter === FILTER_ALL ? (
            <HorizontalScroll scrollAmount={260}>
              {artistClips.map((clip) => (
                <div
                  key={clip.id}
                  className="music-cards-item clips-item"
                  onClick={() => navigate(`/music/video/${clip.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/music/video/${clip.id}`)}
                  aria-label={`${clip.title} - ${artist.name}`}
                >
                  <div className="music-cards-item-image-wrapper clips-image-wrapper">
                    <img
                      src={clip.img || '/img/movie1.jpg'}
                      alt={clip.title}
                      className="music-cards-item-image"
                    />
                    <button
                      type="button"
                      className={`music-cards-item-wishlist-btn ${isInWishlist(clip.id, 'klip') ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(clip.id, 'klip'); }}
                      aria-label={isInWishlist(clip.id, 'klip') ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(clip.id, 'klip') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <div className="music-cards-item-play">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                    <div className="music-cards-item-info">
                      <h3 className="music-cards-item-title">{clip.title}</h3>
                      <p className="music-cards-item-artist">{artist.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </HorizontalScroll>
            ) : (
            <div className="artist-detail-clips-grid">
              {artistClips.map((clip) => (
                <div
                  key={clip.id}
                  className="music-cards-item clips-item"
                  onClick={() => navigate(`/music/video/${clip.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/music/video/${clip.id}`)}
                  aria-label={`${clip.title} - ${artist.name}`}
                >
                  <div className="music-cards-item-image-wrapper clips-image-wrapper">
                    <img
                      src={clip.img || '/img/movie1.jpg'}
                      alt={clip.title}
                      className="music-cards-item-image"
                    />
                    <button
                      type="button"
                      className={`music-cards-item-wishlist-btn ${isInWishlist(clip.id, 'klip') ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(clip.id, 'klip'); }}
                      aria-label={isInWishlist(clip.id, 'klip') ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(clip.id, 'klip') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <div className="music-cards-item-play">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                    <div className="music-cards-item-info">
                      <h3 className="music-cards-item-title">{clip.title}</h3>
                      <p className="music-cards-item-artist">{artist.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}
        {(activeFilter === FILTER_ALL || activeFilter === FILTER_SHORTS) && artistShorts.length > 0 && (
          <div className={`artist-detail-clips-wrap clips-cards artist-detail-shorts-wrap${activeFilter !== FILTER_ALL ? ' artist-detail-section--filtered' : ''}`}>
            <h3 className="artist-detail-clips-title">{t('music.shorts', 'Shorts')}</h3>
            {activeFilter === FILTER_ALL ? (
            <HorizontalScroll scrollAmount={220}>
              {artistShorts.map((short) => {
                const globalIndex = musicShorts.findIndex((s) => s.id === short.id);
                const safeIndex = globalIndex >= 0 ? globalIndex : 0;
                return (
                  <div
                    key={short.id}
                    className="artist-detail-shorts-card music-cards-item clips-item"
                    onClick={() => navigate(`/music/shorts?startIndex=${safeIndex}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/music/shorts?startIndex=${safeIndex}`)}
                    aria-label={`${getShortTitle(short, contentLang)} - ${artist.name}`}
                  >
                    <div className="music-cards-item-image-wrapper clips-image-wrapper artist-detail-shorts-thumb">
                      <video
                        src={getShortVideo(short, contentLang)}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="artist-detail-shorts-preview"
                      />
                      <div className="music-cards-item-info artist-detail-shorts-info">
                        <h3 className="music-cards-item-title">{getShortTitle(short, contentLang)}</h3>
                        <p className="music-cards-item-artist">{artist.name}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </HorizontalScroll>
            ) : (
            <div className="artist-detail-clips-grid artist-detail-shorts-grid">
              {artistShorts.map((short) => {
                const globalIndex = musicShorts.findIndex((s) => s.id === short.id);
                const safeIndex = globalIndex >= 0 ? globalIndex : 0;
                return (
                  <div
                    key={short.id}
                    className="artist-detail-shorts-card music-cards-item clips-item"
                    onClick={() => navigate(`/music/shorts?startIndex=${safeIndex}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/music/shorts?startIndex=${safeIndex}`)}
                    aria-label={`${getShortTitle(short, contentLang)} - ${artist.name}`}
                  >
                    <div className="music-cards-item-image-wrapper clips-image-wrapper artist-detail-shorts-thumb">
                      <video
                        src={getShortVideo(short, contentLang)}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="artist-detail-shorts-preview"
                      />
                      <div className="music-cards-item-info artist-detail-shorts-info">
                        <h3 className="music-cards-item-title">{getShortTitle(short, contentLang)}</h3>
                        <p className="music-cards-item-artist">{artist.name}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}
        {(activeFilter === FILTER_ALL || activeFilter === FILTER_KONSERT) && artistConcerts.length > 0 && (
          <div className={`artist-detail-clips-wrap clips-cards${activeFilter !== FILTER_ALL ? ' artist-detail-section--filtered' : ''}`}>
            <h3 className="artist-detail-clips-title">{t('music.concerts', 'Konsertlar')}</h3>
            {activeFilter === FILTER_ALL ? (
            <HorizontalScroll scrollAmount={260}>
              {artistConcerts.map((concert) => (
                <div
                  key={concert.id}
                  className="music-cards-item clips-item"
                  onClick={() => navigate(`/music/video/${concert.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/music/video/${concert.id}`)}
                  aria-label={`${concert.title} - ${artist.name}`}
                >
                  <div className="music-cards-item-image-wrapper clips-image-wrapper">
                    <img
                      src={concert.img || '/img/movie1.jpg'}
                      alt={concert.title}
                      className="music-cards-item-image"
                    />
                    <button
                      type="button"
                      className={`music-cards-item-wishlist-btn ${isInWishlist(concert.id, 'konsert') ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(concert.id, 'konsert'); }}
                      aria-label={isInWishlist(concert.id, 'konsert') ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(concert.id, 'konsert') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <div className="music-cards-item-play">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                    <div className="music-cards-item-info">
                      <h3 className="music-cards-item-title">{concert.title}</h3>
                      <p className="music-cards-item-artist">{artist.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </HorizontalScroll>
            ) : (
            <div className="artist-detail-clips-grid">
              {artistConcerts.map((concert) => (
                <div
                  key={concert.id}
                  className="music-cards-item clips-item"
                  onClick={() => navigate(`/music/video/${concert.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/music/video/${concert.id}`)}
                  aria-label={`${concert.title} - ${artist.name}`}
                >
                  <div className="music-cards-item-image-wrapper clips-image-wrapper">
                    <img
                      src={concert.img || '/img/movie1.jpg'}
                      alt={concert.title}
                      className="music-cards-item-image"
                    />
                    <button
                      type="button"
                      className={`music-cards-item-wishlist-btn ${isInWishlist(concert.id, 'konsert') ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(concert.id, 'konsert'); }}
                      aria-label={isInWishlist(concert.id, 'konsert') ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(concert.id, 'konsert') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <div className="music-cards-item-play">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                    <div className="music-cards-item-info">
                      <h3 className="music-cards-item-title">{concert.title}</h3>
                      <p className="music-cards-item-artist">{artist.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}
        {(activeFilter === FILTER_ALL || activeFilter === FILTER_MOVIES) && artistMovies.length > 0 && (
          <div className={`artist-detail-clips-wrap artist-detail-movies-wrap${activeFilter !== FILTER_ALL ? ' artist-detail-section--filtered' : ''}`}>
            <h3 className="artist-detail-clips-title">{t('movies.movies', 'Kinolar')}</h3>
            {activeFilter === FILTER_ALL ? (
              <HorizontalScroll scrollAmount={220}>
                {artistMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="music-cards-item artist-detail-movie-item"
                    onClick={() => navigate(`/movie/${movie.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/movie/${movie.id}`)}
                    aria-label={getMovieTitle(movie)}
                  >
                    <div className="music-cards-item-image-wrapper artist-detail-movie-image-wrapper">
                      <img
                        src={getMovieImage(movie)}
                        alt={getMovieTitle(movie)}
                        className="music-cards-item-image"
                      />
                      <button
                        type="button"
                        className={`music-cards-item-wishlist-btn ${isInWishlist(movie.id, 'movie') ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(movie.id, 'movie'); }}
                        aria-label={isInWishlist(movie.id, 'movie') ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(movie.id, 'movie') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      {movie.category === 'anonslar' ? (
                        <div className="movies-item-badge movies-item-badge-soon">{t('searchModal.tezOrada', 'Tez orada')}</div>
                      ) : (
                        <div className="movies-item-badge movies-item-badge-fhd">FHD</div>
                      )}
                      {movie.ageRestriction != null && (
                        <div className="movies-item-badge movies-item-badge-age">{movie.ageRestriction}+</div>
                      )}
                      {movie.category !== 'anonslar' && movie.rating != null && movie.rating !== '' && movie.rating !== 'none' && (
                        <div className="movies-item-rating">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd700" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          <span>{movie.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </HorizontalScroll>
            ) : (
              <div className="artist-detail-albums-grid artist-detail-movies-grid">
                {artistMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="music-cards-item artist-detail-movie-item"
                    onClick={() => navigate(`/movie/${movie.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/movie/${movie.id}`)}
                    aria-label={getMovieTitle(movie)}
                  >
                    <div className="music-cards-item-image-wrapper artist-detail-movie-image-wrapper">
                      <img
                        src={getMovieImage(movie)}
                        alt={getMovieTitle(movie)}
                        className="music-cards-item-image"
                      />
                      <button
                        type="button"
                        className={`music-cards-item-wishlist-btn ${isInWishlist(movie.id, 'movie') ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(movie.id, 'movie'); }}
                        aria-label={isInWishlist(movie.id, 'movie') ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(movie.id, 'movie') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      {movie.category === 'anonslar' ? (
                        <div className="movies-item-badge movies-item-badge-soon">{t('searchModal.tezOrada', 'Tez orada')}</div>
                      ) : (
                        <div className="movies-item-badge movies-item-badge-fhd">FHD</div>
                      )}
                      {movie.ageRestriction != null && (
                        <div className="movies-item-badge movies-item-badge-age">{movie.ageRestriction}+</div>
                      )}
                      {movie.category !== 'anonslar' && movie.rating != null && movie.rating !== '' && movie.rating !== 'none' && (
                        <div className="movies-item-rating">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd700" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          <span>{movie.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistDetail;
