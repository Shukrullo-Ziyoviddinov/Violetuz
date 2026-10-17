import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Triller from '../components/Triller/Triller';
import { useMiniVideoDetailPage } from '../MiniVideo/MiniVideoPlaybackContext';
import './TrillerPage.css';

const TrillerPage = () => {
  useMiniVideoDetailPage();
  const { id } = useParams();

  useEffect(() => {
    document.documentElement.classList.add('triller-page-lock');
    document.body.classList.add('triller-page-active');
    return () => {
      document.documentElement.classList.remove('triller-page-lock');
      document.body.classList.remove('triller-page-active');
    };
  }, []);

  return (
    <div className="triller-page">
      <Triller activeId={id} />
    </div>
  );
};

export default TrillerPage;
