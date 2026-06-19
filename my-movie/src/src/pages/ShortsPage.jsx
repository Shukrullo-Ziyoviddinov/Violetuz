import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ShortsVideos from '../components/ShortsVideos/ShortsVideos';
import './ShortsPage.css';

const ShortsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startIndex = searchParams.get('startIndex');
  const startIndexNum = startIndex != null ? parseInt(startIndex, 10) : null;
  const fromHomeLink = startIndex != null && !isNaN(startIndexNum);

  const handleCloseFromHome = () => {
    if (fromHomeLink) navigate(-1);
  };

  return (
    <div className="shorts-page">
      <ShortsVideos
        startIndex={isNaN(startIndexNum) ? null : startIndexNum}
        onCloseFromHome={fromHomeLink ? handleCloseFromHome : undefined}
      />
    </div>
  );
};

export default ShortsPage;
