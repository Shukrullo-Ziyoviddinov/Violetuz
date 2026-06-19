import React from 'react';
import { useNavigate } from 'react-router-dom';
import LikeButton from '../../Music/LikeButton/LikeButton';
import { useWishlist } from '../../context/WishlistContext';
import { formatActionCount } from '../../utils/utils';
import './FeedMovieCard.css';

const FeedMovieCard = ({ item }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const saved = isInWishlist(item.movieId, 'movie');

  return (
    <div className="feed-movie-card" onClick={() => navigate(`/movie/${item.movieId}`)} role="button" tabIndex={0}>
      <div className="feed-movie-card-profile">
        <img src={item.actorImage} alt={item.actorName} className="feed-movie-card-avatar" />
        <div className="feed-movie-card-profile-text">
          <div className="feed-movie-card-name">
            <span className="feed-movie-card-name-text">{item.actorName}</span>
            <img src="/img/galichka2.png" alt="" className="feed-movie-card-name-verified" aria-hidden />
          </div>
          <div className="feed-movie-card-type">Movie actor</div>
        </div>
      </div>
      <img src={item.cover} alt={item.title} className="feed-movie-card-cover" />
      <div className="feed-movie-card-actions" onClick={(e) => e.stopPropagation()} role="presentation">
        <div className="feed-movie-card-actions-like-group">
          <LikeButton
            key={item.movieId}
            variant="movieDetail"
            contentId={String(item.movieId)}
            persistKey={`movie_${item.movieId}`}
            likeMeta={{
              category: item.type || 'movie',
              title: item.title || '',
              image: item.cover || '',
              route: `/movie/${item.movieId}`,
            }}
            initialLikeCount={item.like}
            initialDislikeCount={item.dislike}
            countFormatter={formatActionCount}
            stopPropagation
          />
        </div>
        <button
          type="button"
          className={`feed-movie-card-fav ${saved ? 'active' : ''}`}
          aria-label="Wishlist"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(item.movieId, 'movie');
          }}
        >
          <i className={`${saved ? 'fa-solid' : 'fa-regular'} fa-heart`} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default FeedMovieCard;
