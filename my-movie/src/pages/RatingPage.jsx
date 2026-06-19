import React from 'react';
import RatingPageLogica from '../components/Rating/RatingPageLogica';
import './RatingPage.css';

const RatingPage = () => {
  return (
    <div className="rating-page">
      <div className="rating-page-container">
        <RatingPageLogica />
      </div>
    </div>
  );
};

export default RatingPage;
