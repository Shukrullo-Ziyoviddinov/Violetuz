import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ScrollTouch from '../../components/ScrollTouch/ScrollTouch';
import './SearchModalCategory.css';

const CATEGORY_TO_SECTION = {
  songs: 'songs',
  artists: 'artists',
  albums: 'albums',
  clips: 'clips',
  concerts: 'concerts',
  shorts: null,
};

const CATEGORIES = ['songs', 'artists', 'albums', 'clips', 'concerts', 'shorts'];

const SearchModalCategory = ({ onCategoryClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasDraggedRef = useRef(false);
  const startXRef = useRef(0);

  const sectionLabels = {
    songs: t('music.searchTypeMusic', 'Musiqa'),
    artists: t('music.searchTypeArtist', 'Artistlar'),
    albums: t('music.searchTypeAlbum', 'Albom'),
    clips: t('music.searchTypeClip', 'Klip'),
    concerts: t('music.searchTypeConcert', 'Konsert'),
    shorts: t('navbar.shorts', 'Shorts'),
  };

  const handleClick = (categoryId) => {
    if (hasDraggedRef.current) return;
    if (onCategoryClick) onCategoryClick();
    if (categoryId === 'shorts') {
      navigate('/shorts');
      return;
    }
    const section = CATEGORY_TO_SECTION[categoryId] || 'trend';
    navigate(`/music/more/${section}`);
  };

  const handlePointerDown = (e) => {
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
  };

  const handlePointerMove = (e) => {
    if (Math.abs(e.clientX - startXRef.current) > 5) {
      hasDraggedRef.current = true;
    }
  };

  return (
    <div className="search-modal-category">
      <ScrollTouch
        className="search-modal-category-list"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        {CATEGORIES.map((id) => (
          <button
            key={id}
            type="button"
            className="search-modal-category-item"
            onClick={() => handleClick(id)}
          >
            <span className="search-modal-category-label">{sectionLabels[id]}</span>
          </button>
        ))}
      </ScrollTouch>
    </div>
  );
};

export default SearchModalCategory;
