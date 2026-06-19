import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import { artists } from '../../dataMusic/artists';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import './RecommendedArtists.css';

const RecommendedArtists = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleArtistClick = (artistId) => {
    navigate(`/music/artist/${artistId}`);
  };

  return (
    <div className="recommended-artists">
      <div className="recommended-artists-container">
        <div className="recommended-artists-header">
          <h2 className="recommended-artists-title">
            {t('music.tavsiyaEtilganArtistlar', 'Tavsiya etilgan artistlar')}
          </h2>
        </div>
        <div className="recommended-artists-content">
          <HorizontalScroll scrollAmount={140}>
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="recommended-artists-item"
                onClick={() => handleArtistClick(artist.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleArtistClick(artist.id);
                  }
                }}
                aria-label={`${artist.name} - ${t('music.title', 'Musiqa')}`}
              >
                <div className="recommended-artists-img-wrap">
                  <img
                    src={artist.imgArtist || artist.img || '/img/movie1.jpg'}
                    alt={artist.name}
                    className="recommended-artists-img"
                  />
                </div>
                <p className="recommended-artists-name">{artist.name}</p>
                <FollowingButton
                  artistId={artist.id}
                  wrapperClassName="recommended-artists-follow"
                  stopPropagation
                />
              </div>
            ))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default RecommendedArtists;
