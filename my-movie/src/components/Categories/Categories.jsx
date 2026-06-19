import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './Categories.css';

const Categories = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const categories = [
    { id: 'romantika', key: 'romantika' },
    { id: 'multfilimlar', key: 'multfilimlar' },
    { id: 'anime', key: 'anime' },
    { id: 'doramalar', key: 'doramalar' },
    { id: 'komediya', key: 'komediya' },
    { id: 'jangari', key: 'jangari' },
    { id: 'horror', key: 'horror' },
    { id: 'sarguzasht', key: 'sarguzasht' },
    { id: 'fantastika', key: 'fantastika' },
  ];

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
          {categories.map((category) => (
            <button
              key={category.id}
              className={`categories-item ${isActiveCategory(category.id) ? 'categories-item--active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              {t(`categories.${category.key}`)}
            </button>
          ))}
        </ScrollTouch>
      </div>
    </div>
  );
};

export default Categories;
