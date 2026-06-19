import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import { useRecommendedClips } from '../../services/recommendedClipsService';
import { artists } from '../../dataMusic/artists';
import './RecommendedClips.css';

/**
 * Tavsiya etilgan kliplar / O'xshash kliplar bo'limi.
 * music: type 'music'. album: type 'musicAlbom'. klip: type 'klip' yoki 'konsert' (VideoPage).
 * titleKey: VideoPage da "music.similarClips" (O'xshash kliplar).
 */
const RecommendedClips = ({ music, album, klip, titleKey = 'music.recommendedClips' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const item = music || album || klip;
  const recommendedClips = useRecommendedClips(item, klip ? { excludeId: klip.id } : {});

  const getTitleText = (it) => {
    if (!it?.title) return '';
    if (typeof it.title === 'object') {
      return it.title[contentLang] || it.title.uz || it.title.ru || it.title.en || '';
    }
    return String(it.title);
  };

  const getArtistText = (artistId) => {
    const artist = artists.find((a) => a.id === artistId);
    return artist?.name || artistId || '';
  };

  const handleCardClick = (clipId) => {
    navigate(`/music/video/${clipId}`, { replace: false });
  };

  if (!item) return null;
  if (music && music.type !== 'music') return null;
  if (album && album.type !== 'musicAlbom') return null;
  if (klip && klip.type !== 'klip' && klip.type !== 'konsert') return null;
  if (!recommendedClips?.length) return null;

  return (
    <div className="recommended-clips">
      <div className="recommended-clips-container">
        <h2 className="recommended-clips-title">{t(titleKey, 'Tavsiya etilgan kliplar')}</h2>
        <div className="recommended-clips-content">
          <HorizontalScroll>
            {recommendedClips.map((item) => (
              <div
                key={item.id}
                className="recommended-clips-item"
                onClick={() => handleCardClick(item.id)}
              >
                <div className="recommended-clips-item-image-wrapper">
                  <img
                    src={item.img || '/img/movie1.jpg'}
                    alt={getTitleText(item)}
                    className="recommended-clips-item-image"
                  />
                  <button
                    className={`recommended-clips-item-wishlist-btn ${isInWishlist(item.id, 'klip') ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(item.id, 'klip');
                    }}
                    aria-label="Sevimlilarga qo'shish"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(item.id, 'klip') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <div className="recommended-clips-item-play">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21" />
                    </svg>
                  </div>
                  <div className="recommended-clips-item-info">
                    <h3 className="recommended-clips-item-title">{getTitleText(item)}</h3>
                    <p className="recommended-clips-item-artist">{getArtistText(item.artistId)}</p>
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

export default RecommendedClips;
