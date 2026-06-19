import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import CartochkaHoverModal from '../../components/cartochkaHoverModal';
import CartochkaMobileAutoPlay from '../../components/cartochkaHoverModal/CartochkaMobileAutoPlay';
import MusicSectionIcons from '../MusicSectionIcons';
import { artists } from '../../dataMusic/artists';
import '../MusicCards/MusicCards.css';
import '../MusicButtonMore/MusicButtonMore.css';
import './ClipsCards.css';

/**
 * Umumiy videoli klip kartochkalar komponenti.
 * Har qanday klip bo'limi uchun ishlatiladi (Trend, Popular, va hokazo).
 */
const ClipsCards = ({ section }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const {
    id,
    data,
    titleKey,
    titleDefault,
    moreTo,
    wishlistType,
    initialCount,
  } = section;

  const getArtistName = (artistId) => {
    const artist = artists.find((a) => a.id === artistId);
    return artist?.name || artistId;
  };

  const handleCardClick = (itemId) => {
    navigate(`/music/video/${itemId}`);
  };

  const handleWishlistClick = (e, itemId) => {
    e.stopPropagation();
    toggleWishlist(itemId, wishlistType);
  };

  const safeData = Array.isArray(data) ? data : [];
  const displayItems = safeData.slice(0, initialCount);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const renderCard = (item) => (
    <div
      className="music-cards-item clips-item"
      onClick={() => handleCardClick(item.id)}
    >
      <div className="music-cards-item-image-wrapper clips-image-wrapper">
        <img
          src={item.img || '/img/movie1.jpg'}
          alt={item.title}
          className="music-cards-item-image"
        />
        <button
          className={`music-cards-item-wishlist-btn ${isInWishlist(item.id, wishlistType) ? 'active' : ''}`}
          onClick={(e) => handleWishlistClick(e, item.id)}
          aria-label="Sevimlilarga qo'shish"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(item.id, wishlistType) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <div className="music-cards-item-play">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21" />
          </svg>
        </div>
        <div className="music-cards-item-info">
          <h3 className="music-cards-item-title">{item.title}</h3>
          <p className="music-cards-item-artist">{getArtistName(item.artistId)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`music-cards clips-cards clips-cards--${id}`}>
      <div className="music-cards-container">
        <div className="music-cards-header">
          <h2 className="music-cards-title">
            <span className="music-cards-title-icon" aria-hidden="true">
              <MusicSectionIcons type={wishlistType || 'klip'} />
            </span>
            <span className="music-cards-title-text">{t(titleKey, titleDefault)}</span>
          </h2>
        </div>
        <div className="music-cards-content">
          <HorizontalScroll>
            {displayItems.map((item) =>
              isMobile ? (
                <CartochkaMobileAutoPlay
                  key={item.id}
                  item={item}
                  onCardClick={handleCardClick}
                >
                  {renderCard(item)}
                </CartochkaMobileAutoPlay>
              ) : (
                <CartochkaHoverModal
                  key={item.id}
                  item={item}
                  getArtistText={(i) => getArtistName(i.artistId)}
                >
                  {renderCard(item)}
                </CartochkaHoverModal>
              )
            )}
            <div
              className="music-button-more music-cards-item"
              onClick={() => navigate(moreTo)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(moreTo)}
              aria-label="Ko'proq ko'rish"
              data-allow-navigate
            >
              <div className="music-button-more-wrapper music-cards-item-image-wrapper">
                <span className="music-button-more-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </div>
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default ClipsCards;
