import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './MoreBtn.css';

const MoreBtn = ({ onClick, to = '/recommended', className = '' }) => {
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
      className={`more-btn ${className}`}
      onClick={handleClick}
    >
      {t('movies.more')}
    </button>
  );
};

export default MoreBtn;
