import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { getLocalizedText } from '../../utils/utils';
import './Categories.css';

const Categories = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { allCategories } = useMoviesApi();
  const lang = i18n.language || 'uz';

  const handleCategoryClick = (categoryId) => {
    navigate(`/category/${categoryId}`);
  };

  const isActiveCategory = (categoryId) => {
    return location.pathname === `/category/${categoryId}`;
  };

  return (
    <div className="categories">
      <div className="categories-container">
        <ScrollTouch className="categories-scroll-touch">
          {(Array.isArray(allCategories) ? allCategories : []).map((category) => (
            <button
              key={category.id}
              className={`categories-item ${isActiveCategory(category.id) ? 'categories-item--active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              {getLocalizedText(category.title, lang)}
            </button>
          ))}
        </ScrollTouch>
      </div>
    </div>
  );
};

export default Categories;
