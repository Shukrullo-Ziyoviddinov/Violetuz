import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ShowMoreButton.css';

/** Barcha bo'limlar uchun standart limit */
export const DEFAULT_LIMIT = 10;

/**
 * Ko'rsatiladigan elementlarni limit bo'yicha qirqadi
 * @param {Array} items - elementlar ro'yxati
 * @param {number|null} limit - limit (null bo'lsa barchasi)
 * @returns {Array} - ko'rsatiladigan elementlar
 */
export const getDisplayItems = (items, limit = DEFAULT_LIMIT) => {
  if (!items || !Array.isArray(items)) return [];
  if (limit == null) return items;
  return items.slice(0, limit);
};

/**
 * "Ko'proq" tugmasi ko'rsatilishini aniqlaydi
 * @param {Array} items - elementlar ro'yxati
 * @param {number|null} limit - limit
 * @param {string|null} moreTo - "Ko'proq" bosilganda boriladigan yo'l
 */
export const shouldShowMore = (items, limit, moreTo = null) => {
  if (!items || !Array.isArray(items)) return false;
  const hasLimitAndMore = limit != null && items.length > limit;
  const hasMoreToAndItems = moreTo && items.length > 0;
  return hasLimitAndMore || hasMoreToAndItems;
};

const ShowMoreButton = ({ onClick, to = '/recommended', className = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };

  return (
    <button
      className={`show-more-btn ${className}`}
      onClick={handleClick}
    >
      {t('movies.more')}
    </button>
  );
};

export default ShowMoreButton;
