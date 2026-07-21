import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { getLocalizedText } from '../../utils/utils';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import './Categories.css';

const CATEGORY_SKELETON_WIDTHS = [120, 100, 90, 110, 100, 80, 100, 110, 90];

const Categories = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { allCategories, categoriesLoading } = useMoviesApi();
  const lang = i18n.language || 'uz';

  const categories = Array.isArray(allCategories) ? allCategories : [];
  const showSkeleton = categoriesLoading && categories.length === 0;

  const handleCategoryClick = (categoryId) => {
    navigate(`/category/${categoryId}`);
  };

  const isActiveCategory = (categoryId) => {
    return location.pathname === `/category/${categoryId}`;
  };

  const getCategoryLabel = (category) => {
    const label = getLocalizedText(category?.title, lang);
    if (label) return label;
    return category?.id || '';
  };

  return (
    <div className="categories" aria-busy={showSkeleton || undefined}>
      <div className="categories-container">
        <ScrollTouch className="categories-scroll-touch">
          {showSkeleton
            ? CATEGORY_SKELETON_WIDTHS.map((width, index) => (
                <SkeletonLoader
                  key={`category-skeleton-${index}`}
                  variant="categories-item"
                  className="categories-item-skeleton"
                  width={width}
                  height={44}
                />
              ))
            : categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`categories-item ${isActiveCategory(category.id) ? 'categories-item--active' : ''}`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
        </ScrollTouch>
      </div>
    </div>
  );
};

export default Categories;
