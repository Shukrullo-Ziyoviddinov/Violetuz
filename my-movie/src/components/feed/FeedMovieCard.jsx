import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LikeButton from '../../Music/LikeButton/LikeButton';
import ShareButton from '../ShareButton/ShareButton';
import MovieComments from '../MovieDetail/MovieComments';
import ViewCount from '../ViewCount/ViewCount';
import UploadedAtTime from '../UploadedAtTime/UploadedAtTime';
import { useWishlist } from '../../context/WishlistContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { formatActionCount } from '../../utils/utils';
import './FeedMovieCard.css';

const buildMetaTextFromMovie = (movie) => {
  if (!movie) return '';
  const year = movie.specs?.year;
  const countries = Array.isArray(movie.specs?.countries)
    ? movie.specs.countries.filter(Boolean).join(', ')
    : '';
  const countryFallback = countries || movie.filterCountry || '';
  const metaParts = [];
  if (year != null && year !== '') metaParts.push(`${year}-yil`);
  if (countryFallback) metaParts.push(countryFallback);
  return metaParts.join(' ');
};

const FeedMovieCard = ({ item }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { allMovies } = useMoviesApi();
  const commentsRef = useRef(null);
  const [commentsCount, setCommentsCount] = useState(0);
  const saved = isInWishlist(item.movieId, 'movie');
  const movieRoute = `/movie/${item.movieId}`;

  const metaText = useMemo(() => {
    if (item.metaText) return item.metaText;
    if (item.year != null || item.filterCountry || (item.countries && item.countries.length)) {
      const parts = [];
      if (item.year != null && item.year !== '') parts.push(`${item.year}-yil`);
      const countries = Array.isArray(item.countries)
        ? item.countries.filter(Boolean).join(', ')
        : '';
      const country = countries || item.filterCountry || '';
      if (country) parts.push(country);
      return parts.join(' ');
    }
    const fromCatalog = allMovies?.find((m) => Number(m.id) === Number(item.movieId));
    return buildMetaTextFromMovie(fromCatalog);
  }, [item, allMovies]);

  return (
    <div className="feed-movie-card" onClick={() => navigate(movieRoute)} role="button" tabIndex={0}>
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
      {item.title ? <h3 className="feed-movie-card-title">{item.title}</h3> : null}
      {metaText ? <p className="feed-movie-card-movie-meta">{metaText}</p> : null}
      {item.movieId != null ? (
        <div className="feed-movie-card-meta-row">
          <ViewCount
            itemId={item.movieId}
            type="movie"
            variant="text"
            record={false}
            className="view-count-text feed-movie-card-view-count"
          />
          <UploadedAtTime
            at={item.createdAt || item.uploadedAt}
            className="feed-movie-card-uploaded-at"
          />
        </div>
      ) : null}
      <div className="feed-movie-card-actions" onClick={(e) => e.stopPropagation()} role="presentation">
        <div className="feed-movie-card-actions-like-group">
          <LikeButton
            key={item.movieId}
            className="feed-movie-like-button"
            contentId={String(item.movieId)}
            persistKey={`movie_${item.movieId}`}
            likeMeta={{
              category: item.type || 'movie',
              title: item.title || '',
              image: item.cover || '',
              route: movieRoute,
            }}
            initialLikeCount={item.like}
            initialDislikeCount={item.dislike}
            countFormatter={formatActionCount}
            stopPropagation
          />
          <button
            type="button"
            className="feed-movie-comment-button"
            onClick={(e) => {
              e.stopPropagation();
              commentsRef.current?.openModal();
            }}
            aria-label="Izohlar"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="feed-movie-comment-count">{formatActionCount(commentsCount)}</span>
          </button>
          <ShareButton
            movie={{ title: item.title || '' }}
            sharePath={movieRoute}
            icon="send"
            dropdownInPortal
            className="feed-movie-share-wrapper"
            buttonClassName="feed-movie-share-button"
          />
        </div>
        <button
          type="button"
          className={`feed-movie-card-fav ${saved ? 'active' : ''}`}
          aria-label="Saqlash"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(item.movieId, 'movie');
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
      <MovieComments
        ref={commentsRef}
        movieId={item.movieId}
        targetType="movie"
        modalOnly
        onCountChange={setCommentsCount}
      />
    </div>
  );
};

export default FeedMovieCard;
