import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { fetchAllCategories } from '../../api/categoriesApi';
import { getLocalizedText } from '../../utils/utils';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import './Categories.css';

const CATEGORY_SKELETON_WIDTHS = [120, 100, 90, 110, 100, 80, 100, 110, 90];

const Categories = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = i18n.language || 'uz';

  // Own query (same key as MoviesApiContext) so chips always load even if context is stale
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchAllCategories,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const categories = Array.isArray(categoriesQuery.data) ? categoriesQuery.data : [];
  const showSkeleton = categoriesQuery.isPending && categories.length === 0;
  const showEmpty = !categoriesQuery.isPending && categories.length === 0;

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
                <span
                  key={`category-skeleton-${index}`}
                  className="categories-item categories-item--skeleton"
                  style={{ width, height: 44 }}
                >
                  <SkeletonLoader
                    variant="categories-item"
                    className="categories-item-skeleton"
                    width="100%"
                    height="100%"
                  />
                </span>
              ))
            : showEmpty
              ? (
                <span className="categories-empty">
                  {categoriesQuery.isError
                    ? 'Kategoriyalar yuklanmadi'
                    : 'Kategoriyalar yo‘q'}
                </span>
              )
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
