import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import { useSimilarSongs } from '../../services/similarSongsService';
import { artists } from '../../dataMusic/artists';
import './SimilarSongs.css';

/**
 * O'xshash musiqalar / Tavsiya etilgan musiqalar bo'limi.
 * music: type 'music'. album: type 'musicAlbom'. klip: type 'klip' yoki 'konsert' (VideoPage).
 * titleKey: VideoPage da "music.recommendedMusic" (Tavsiya etilgan musiqalar).
 */
const SimilarSongs = ({ music, album, klip, titleKey = 'music.similarSongs' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const item = music || album || klip;
  const similarSongs = useSimilarSongs(item);

  const getTitleText = (item) => {
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

  const handleCardClick = (itemId, sectionId) => {
    const path = `/music/${itemId}${sectionId ? `?section=${encodeURIComponent(sectionId)}` : ''}`;
    navigate(path, { replace: false });
  };

  if (!item) return null;
  if (music && music.type !== 'music') return null;
  if (album && album.type !== 'musicAlbom') return null;
  if (klip && klip.type !== 'klip' && klip.type !== 'konsert') return null;
  if (!similarSongs?.length) return null;

  return (
    <div className="similar-songs">
      <div className="similar-songs-container">
        <h2 className="similar-songs-title">{t(titleKey, 'O\'xshash musiqalar')}</h2>
        <div className="similar-songs-content">
          <HorizontalScroll>
            {similarSongs.map((item) => (
              <div
                key={item.id}
                className="similar-songs-item"
                onClick={() => handleCardClick(item.id, item.sectionId)}
              >
                <div className="similar-songs-item-image-wrapper">
                  <img
                    src={item.img || '/img/movie1.jpg'}
                    alt={getTitleText(item)}
                    className="similar-songs-item-image"
                  />
                  <button
                    className={`similar-songs-item-wishlist-btn ${isInWishlist(item.id, 'music') ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(item.id, 'music');
                    }}
                    aria-label="Sevimlilarga qo'shish"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(item.id, 'music') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <div className="similar-songs-item-play">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21" />
                    </svg>
                  </div>
                  <div className="similar-songs-item-info">
                    <h3 className="similar-songs-item-title">{getTitleText(item)}</h3>
                    <p className="similar-songs-item-artist">{getArtistName(item.artistId)}</p>
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

export default SimilarSongs;
