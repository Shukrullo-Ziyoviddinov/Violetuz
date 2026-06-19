import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import MusicButtonMore from '../MusicButtonMore/MusicButtonMore';
import MusicSectionIcons from '../MusicSectionIcons';
import CartochkaHoverModal from '../../components/cartochkaHoverModal';
import { artists } from '../../dataMusic/artists';
import './MusicCards.css';

/**
 * Umumiy musiqa bo'limlari kartochkasi.
 * Har qanday musiqa bo'limi uchun ishlatiladi (Trend, Discover, Music Library va hokazo).
 * Section config orqali data, title, moreTo boshqariladi.
 */
const MusicCards = ({ section }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const {
    id,
    data,
    titleKey,
    titleDefault,
    moreTo,
    wishlistType = 'music',
    initialCount,
    getDetailPath = (id) => `/music/${id}`,
    getArtistDisplay,
  } = section;

  const getTitle = (item) => {
    if (!item?.title) return '';
    if (typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
    }
    return String(item.title);
  };

  const getArtistName = (artistId) => {
    const artist = artists.find((a) => a.id === artistId);
    return artist?.name || artistId;
  };

  const handleCardClick = (itemId) => {
    const path = getDetailPath(itemId);
    navigate(`${path}?section=${encodeURIComponent(section.id)}`, { replace: false });
  };

  const getArtistText = (item) => {
    if (getArtistDisplay) return getArtistDisplay(item);
    return getArtistName(item.artistId) || item.artist || '';
  };

  const handleWishlistClick = (e, id) => {
    e.stopPropagation();
    toggleWishlist(id, wishlistType);
  };

  const safeData = Array.isArray(data) ? data : [];
  const displayItems = safeData.slice(0, initialCount);

  return (
    <div className={`music-cards music-cards--${id}`}>
      <div className="music-cards-container">
        <div className="music-cards-header">
          <h2 className="music-cards-title">
            <span className="music-cards-title-icon" aria-hidden="true">
              <MusicSectionIcons type={wishlistType} />
            </span>
            <span className="music-cards-title-text">{t(titleKey, titleDefault)}</span>
          </h2>
        </div>
        <div className="music-cards-content">
          <HorizontalScroll>
            {displayItems.map((item) => (
              <CartochkaHoverModal
                key={item.id}
                item={item}
                getArtistText={getArtistText}
                getTitle={getTitle}
              >
                <div
                  className="music-cards-item"
                  onClick={() => handleCardClick(item.id)}
                >
                  <div className="music-cards-item-image-wrapper">
                    <img
                      src={item.img || '/img/movie1.jpg'}
                      alt={getTitle(item)}
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
                      <h3 className="music-cards-item-title">{getTitle(item)}</h3>
                      <p className="music-cards-item-artist">{getArtistText(item)}</p>
                    </div>
                  </div>
                </div>
              </CartochkaHoverModal>
            ))}
            {moreTo && safeData.length > 0 && (
              <MusicButtonMore to={moreTo} />
            )}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default MusicCards;
