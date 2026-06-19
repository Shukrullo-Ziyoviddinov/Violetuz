import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { allMovies } from '../data/movies';
import TrailerModal, { TrailerCloseButton } from '../components/MovieDetail/TrailerModal';
import '../components/MovieDetail/TrailerModal.css';
import './TrailerPage.css';

const TrailerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const movie = allMovies.find((m) => m.id === parseInt(id, 10));

  const handleClose = () => navigate(-1);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.classList.add('trailer-page-active');
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.classList.remove('trailer-page-active');
    };
  }, []);

  if (!movie) {
    return (
      <div className="trailer-page">
        <div className="trailer-page-overlay">
          <div className="trailer-modal">
            <TrailerCloseButton onClick={handleClose} label={t('common.back', 'Back')} />
            <div className="trailer-modal-no-trailers">
              <p>{t('detail.movieNotFound') || 'Movie not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trailer-page">
      <TrailerModal movie={movie} onClose={handleClose} variant="page" />
    </div>
  );
};

export default TrailerPage;
