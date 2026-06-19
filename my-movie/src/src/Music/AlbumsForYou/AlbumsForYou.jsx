import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import { useRecommendedAlbums } from '../../services/recommendedAlbumsService';
import { artists } from '../../dataMusic/artists';
import './AlbumsForYou.css';

/**
 * Siz uchun albomlar / O'xshash albomlar bo'limi.
 * music: type 'music'. album: type 'musicAlbom'. klip: type 'klip' yoki 'konsert' (VideoPage).
 */
const AlbumsForYou = ({ music, album, klip, titleKey = 'music.albumsForYou' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const item = music || album || klip;
  const recommendedAlbums = useRecommendedAlbums(
    item,
    album ? { excludeId: album.id } : {}
  );

  const getTitleText = (item) => {
    if (!item?.title) return '';
    if (typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
    }
    return String(item.title);
  };

  const getArtistText = (item) => {
    if (item?.artist) return item.artist;
    const artist = artists.find((a) => a.id === item?.artistId);
    return artist?.name || item?.artistId || '';
  };

  const handleCardClick = (albumId, sectionId) => {
    const path = `/music/album/${albumId}${sectionId ? `?section=${encodeURIComponent(sectionId)}` : ''}`;
    navigate(path, { replace: false });
  };

  if (!item) return null;
  if (music && music.type !== 'music') return null;
  if (album && album.type !== 'musicAlbom') return null;
  if (klip && klip.type !== 'klip' && klip.type !== 'konsert') return null;
  if (!recommendedAlbums?.length) return null;

  return (
    <div className="albums-for-you">
      <div className="albums-for-you-container">
        <h2 className="albums-for-you-title">{t(titleKey, 'Siz uchun albomlar')}</h2>
        <div className="albums-for-you-content">
          <HorizontalScroll>
            {recommendedAlbums.map((item) => (
              <div
                key={item.id}
                className="albums-for-you-item"
                onClick={() => handleCardClick(item.id, item.sectionId)}
              >
                <div className="albums-for-you-item-image-wrapper">
                  <img
                    src={item.img || '/img/movie1.jpg'}
                    alt={getTitleText(item)}
                    className="albums-for-you-item-image"
                  />
                  <button
                    className={`albums-for-you-item-wishlist-btn ${isInWishlist(item.id, 'album') ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(item.id, 'album');
                    }}
                    aria-label="Sevimlilarga qo'shish"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(item.id, 'album') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <div className="albums-for-you-item-play">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21" />
                    </svg>
                  </div>
                  <div className="albums-for-you-item-info">
                    <h3 className="albums-for-you-item-title">{getTitleText(item)}</h3>
                    <p className="albums-for-you-item-artist">{getArtistText(item)}</p>
                  </div>
                </div>
              </div>
            ))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default AlbumsForYou;
