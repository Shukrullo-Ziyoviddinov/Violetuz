import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../context/WishlistContext';
import { useContentLanguage } from '../context/ContentLanguageContext';
import { useLoading } from '../context/LoadingContext';
import { allMovies } from '../data/movies';
import { allMusicData } from '../dataMusic/allMusicData';
import { allAlbums, allClipsData, allConcertsData } from '../dataMusic/wishlistDataConfig';
import { artists } from '../dataMusic/artists';
import Movies from '../components/Movies/Movies';
import LoaderSkeleton from '../components/LoaderSkeleton/LoaderSkeleton';
import ScrollTouch from '../components/ScrollTouch/ScrollTouch';
import './WishlistPage.css';

const iconSize = 18;
const WishlistTabIcons = {
  movie: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  ),
  music: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  album: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  klip: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  konsert: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
};

const WishlistPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { wishlistLoading, setLoading } = useLoading();
  const [activeTab, setActiveTab] = useState('movie');

  const matchWishlist = (itemId, type) =>
    wishlistItems.some((x) => x.id == itemId && x.type === type);

  const wishlistMovies = allMovies.filter((m) => matchWishlist(m.id, 'movie'));
  const wishlistAlbums = allAlbums.filter((a) => matchWishlist(a.id, 'album'));
  const wishlistMusic = allMusicData.filter((m) => matchWishlist(m.id, 'music'));
  const wishlistClips = allClipsData.filter((c) => matchWishlist(c.id, 'klip'));
  const wishlistConcerts = allConcertsData.filter((c) => matchWishlist(c.id, 'konsert'));

  const hasMovies = wishlistMovies.length > 0;
  const hasMusic = wishlistMusic.length > 0;
  const hasAlbums = wishlistAlbums.length > 0;
  const hasClips = wishlistClips.length > 0;
  const hasConcerts = wishlistConcerts.length > 0;
  const isEmpty = !hasMovies && !hasMusic && !hasAlbums && !hasClips && !hasConcerts;
  const showTabs = (hasMovies ? 1 : 0) + (hasMusic ? 1 : 0) + (hasAlbums ? 1 : 0) + (hasClips ? 1 : 0) + (hasConcerts ? 1 : 0) >= 2;

  const getDefaultTab = () => {
    if (hasMovies) return 'movie';
    if (hasMusic) return 'music';
    if (hasAlbums) return 'album';
    if (hasClips) return 'klip';
    if (hasConcerts) return 'konsert';
    return 'movie';
  };

  useEffect(() => {
    setLoading('wishlist', true);
    const timer = setTimeout(() => setLoading('wishlist', false), 500);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const getMusicTitle = (item) => {
    if (!item?.title) return '';
    if (typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
    }
    return String(item.title);
  };

  const getArtistName = (artistId) => {
    const artist = artists.find((a) => a.id === artistId);
    return artist?.name || artistId || '';
  };

  const handleMusicWishlistClick = (e, id) => {
    e.stopPropagation();
    toggleWishlist(id, 'music');
  };

  const handleAlbumWishlistClick = (e, id) => {
    e.stopPropagation();
    toggleWishlist(id, 'album');
  };

  const handleClipWishlistClick = (e, id, type) => {
    e.stopPropagation();
    toggleWishlist(id, type || 'klip');
  };

  if (isEmpty) {
    return (
      <div className="wishlist-page wishlist-page--empty">
        <div className="wishlist-empty">
          {wishlistLoading ? (
            <LoaderSkeleton variant="wishlist-empty-img" className="wishlist-empty-img-skeleton" width={200} height={200} />
          ) : (
            <img
              src="/img/wishlist_preview_rev_1.png"
              alt={t('wishlist.emptyText')}
              className="wishlist-empty-img"
            />
          )}
          {!wishlistLoading && (
            <>
              <p className="wishlist-empty-text">
                {t('wishlist.emptyText')}
              </p>
              <button
                className="wishlist-empty-btn"
                onClick={() => navigate('/')}
              >
                {t('wishlist.goToHome')}
              </button>
            </>
          )}
          {wishlistLoading && (
            <LoaderSkeleton variant="wishlist-empty-btn" className="wishlist-empty-btn-skeleton" width={160} height={44} />
          )}
        </div>
      </div>
    );
  }

  const effectiveTab = showTabs
    ? ((activeTab === 'movie' && hasMovies) || (activeTab === 'music' && hasMusic) || (activeTab === 'album' && hasAlbums) || (activeTab === 'klip' && hasClips) || (activeTab === 'konsert' && hasConcerts)
        ? activeTab
        : getDefaultTab())
    : hasMovies
      ? 'movie'
      : hasMusic
        ? 'music'
        : hasAlbums
          ? 'album'
          : hasClips
            ? 'klip'
            : 'konsert';

  return (
    <div className="wishlist-page">
      {showTabs && (
        <ScrollTouch className="wishlist-tabs">
          {hasMovies && (
            <button
              className={`wishlist-tab ${effectiveTab === 'movie' ? 'active' : ''}`}
              onClick={() => setActiveTab('movie')}
            >
              <span className="wishlist-tab-icon">{WishlistTabIcons.movie}</span>
              {t('wishlist.tabMovies', 'Kino')}
            </button>
          )}
          {hasMusic && (
            <button
              className={`wishlist-tab ${effectiveTab === 'music' ? 'active' : ''}`}
              onClick={() => setActiveTab('music')}
            >
              <span className="wishlist-tab-icon">{WishlistTabIcons.music}</span>
              {t('wishlist.tabMusic', 'Musiqa')}
            </button>
          )}
          {hasAlbums && (
            <button
              className={`wishlist-tab ${effectiveTab === 'album' ? 'active' : ''}`}
              onClick={() => setActiveTab('album')}
            >
              <span className="wishlist-tab-icon">{WishlistTabIcons.album}</span>
              {t('wishlist.tabAlbums', 'Albom')}
            </button>
          )}
          {hasClips && (
            <button
              className={`wishlist-tab ${effectiveTab === 'klip' ? 'active' : ''}`}
              onClick={() => setActiveTab('klip')}
            >
              <span className="wishlist-tab-icon">{WishlistTabIcons.klip}</span>
              {t('wishlist.tabClips', 'Klip')}
            </button>
          )}
          {hasConcerts && (
            <button
              className={`wishlist-tab ${effectiveTab === 'konsert' ? 'active' : ''}`}
              onClick={() => setActiveTab('konsert')}
            >
              <span className="wishlist-tab-icon">{WishlistTabIcons.konsert}</span>
              {t('wishlist.tabKonserts', 'Konsert')}
            </button>
          )}
        </ScrollTouch>
      )}

      {effectiveTab === 'movie' && (
        <Movies
          sectionType="wishlist"
          limit={null}
          filteredMovies={wishlistMovies}
          hideHeader
          isLoading={wishlistLoading}
        />
      )}

      {effectiveTab === 'album' && (
        <div className="wishlist-music">
          <div className="wishlist-music-container">
            {wishlistLoading ? (
              <div className="wishlist-music-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="wishlist-music-skeleton-wrapper">
                    <LoaderSkeleton variant="image" width={160} height={160} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="wishlist-music-grid">
                {wishlistAlbums.map((album) => (
                  <div
                    key={`album-${album.id}`}
                    className="wishlist-music-item"
                    onClick={() => navigate(`/music/album/${album.id}`)}
                  >
                    <div className="wishlist-music-item-image-wrapper">
                      <img
                        src={album.img || '/img/movie1.jpg'}
                        alt={album.title}
                        className="wishlist-music-item-image"
                      />
                      <button
                        className="wishlist-music-item-wishlist-btn active"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(album.id, 'album');
                        }}
                        aria-label="Sevimlilardan olib tashlash"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="wishlist-music-item-info">
                      <h3 className="wishlist-music-item-title">{album.title}</h3>
                      <p className="wishlist-music-item-artist">{album.artist}</p>
                    </div>
                    <div className="wishlist-music-item-play">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {effectiveTab === 'music' && (
        <div className="wishlist-music">
          <div className="wishlist-music-container">
            {wishlistLoading ? (
              <div className="wishlist-music-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="wishlist-music-skeleton-wrapper">
                    <LoaderSkeleton variant="image" width={160} height={160} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="wishlist-music-grid">
                {wishlistMusic.map((item) => (
                  <div
                    key={`music-${item.id}`}
                    className="wishlist-music-item"
                    onClick={() => navigate(`/music/${item.id}`)}
                  >
                    <div className="wishlist-music-item-image-wrapper">
                      <img
                        src={item.img || '/img/movie1.jpg'}
                        alt={getMusicTitle(item)}
                        className="wishlist-music-item-image"
                      />
                      <button
                        className="wishlist-music-item-wishlist-btn active"
                        onClick={(e) => handleMusicWishlistClick(e, item.id)}
                        aria-label="Sevimlilardan olib tashlash"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="wishlist-music-item-info">
                      <h3 className="wishlist-music-item-title">{getMusicTitle(item)}</h3>
                      <p className="wishlist-music-item-artist">{getArtistName(item.artistId)}</p>
                    </div>
                    <div className="wishlist-music-item-play">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {effectiveTab === 'klip' && (
        <div className="wishlist-music wishlist-music--clips">
          <div className="wishlist-music-container">
            {wishlistLoading ? (
              <div className="wishlist-music-grid wishlist-music-grid--clips">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="wishlist-music-skeleton-wrapper">
                    <LoaderSkeleton variant="image" width={240} height={135} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="wishlist-music-grid wishlist-music-grid--clips">
                {wishlistClips.map((item) => (
                  <div
                    key={`${item.type || 'klip'}-${item.id}`}
                    className="wishlist-music-item wishlist-music-item--klip"
                    onClick={() => navigate(`/music/video/${item.id}`)}
                  >
                    <div className="wishlist-music-item-image-wrapper">
                      <img
                        src={item.img || '/img/movie1.jpg'}
                        alt={item.title}
                        className="wishlist-music-item-image"
                      />
                      <button
                        className="wishlist-music-item-wishlist-btn active"
                        onClick={(e) => handleClipWishlistClick(e, item.id, item.type || 'klip')}
                        aria-label="Sevimlilardan olib tashlash"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="wishlist-music-item-info">
                      <h3 className="wishlist-music-item-title">{item.title}</h3>
                      <p className="wishlist-music-item-artist">{getArtistName(item.artistId)}</p>
                    </div>
                    <div className="wishlist-music-item-play">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {effectiveTab === 'konsert' && (
        <div className="wishlist-music wishlist-music--clips">
          <div className="wishlist-music-container">
            {wishlistLoading ? (
              <div className="wishlist-music-grid wishlist-music-grid--clips">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="wishlist-music-skeleton-wrapper">
                    <LoaderSkeleton variant="image" width={240} height={135} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="wishlist-music-grid wishlist-music-grid--clips">
                {wishlistConcerts.map((item) => (
                  <div
                    key={`konsert-${item.id}`}
                    className="wishlist-music-item wishlist-music-item--klip"
                    onClick={() => navigate(`/music/video/${item.id}`)}
                  >
                    <div className="wishlist-music-item-image-wrapper">
                      <img
                        src={item.img || '/img/movie1.jpg'}
                        alt={item.title}
                        className="wishlist-music-item-image"
                      />
                      <button
                        className="wishlist-music-item-wishlist-btn active"
                        onClick={(e) => handleClipWishlistClick(e, item.id, 'konsert')}
                        aria-label="Sevimlilardan olib tashlash"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="wishlist-music-item-info">
                      <h3 className="wishlist-music-item-title">{item.title}</h3>
                      <p className="wishlist-music-item-artist">{getArtistName(item.artistId)}</p>
                    </div>
                    <div className="wishlist-music-item-play">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
