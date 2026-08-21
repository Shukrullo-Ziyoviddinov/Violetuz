import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LikeButton from '../../Music/LikeButton/LikeButton';
import ShareButton from '../ShareButton/ShareButton';
import MovieComments from '../MovieDetail/MovieComments';
import { useWishlist } from '../../context/WishlistContext';
import { formatActionCount } from '../../utils/utils';
import './FeedVideoCard.css';

const FeedVideoCard = ({ item }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const commentsRef = useRef(null);
  const [commentsCount, setCommentsCount] = useState(0);
  const wishlistType = item.wishlistType || 'klip';
  const commentType = wishlistType === 'konsert' ? 'konsert' : 'klip';
  const saved = isInWishlist(item.videoId, wishlistType);
  const isShorts = item.type === 'movieShorts' || item.type === 'musicshorts';
  const videoRoute = item.route || `/music/video/${item.videoId}`;

  return (
    <div className="feed-video-card" onClick={() => navigate(videoRoute)} role="button" tabIndex={0}>
      <div className="feed-video-card-profile">
        <img src={item.artistImage} alt={item.artistName} className="feed-video-card-avatar" />
        <div className="feed-video-card-profile-text">
          <div className="feed-video-card-name">
            <span className="feed-video-card-name-text">{item.artistName}</span>
            <img src="/img/galichka.png" alt="" className="feed-artist-name-verified" aria-hidden />
          </div>
          <div className="feed-video-card-type">Music artist</div>
        </div>
      </div>
      <div className="feed-video-card-media-wrap">
        <img src={item.cover} alt={item.title} className="feed-video-card-cover" />
        <div className="feed-video-card-badge">{item.videoKind}</div>
      </div>
      <div className="feed-video-card-info video-detail-info">
        <span className="video-detail-title">{item.title}</span>
        <span
          className="video-detail-artist-name"
          role="link"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (item.artistId) navigate(`/music/artist/${item.artistId}`);
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && item.artistId) {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/music/artist/${item.artistId}`);
            }
          }}
        >
          {item.artistName}
        </span>
      </div>
      <div className="feed-video-card-actions" onClick={(e) => e.stopPropagation()} role="presentation">
        <div className="feed-video-card-actions-like-group">
          {isShorts ? (
            <LikeButton
              variant="shorts"
              contentId={String(item.shortsId || item.videoId)}
              stopPropagation
              className="feed-video-like-button"
            />
          ) : (
            <LikeButton
              contentId={String(item.videoId)}
              persistKey={`video_${item.videoId}`}
              initialLikeCount={item.like}
              initialDislikeCount={item.dislike}
              className="feed-video-like-button"
              likeMeta={{
                category: item.type || wishlistType || 'klip',
                title: item.title || '',
                image: item.cover || '',
                route: videoRoute,
              }}
            />
          )}
          {!isShorts ? (
            <>
              <button
                type="button"
                className="feed-video-comment-button"
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
                <span className="feed-video-comment-count">{formatActionCount(commentsCount)}</span>
              </button>
              <ShareButton
                movie={{ title: item.title || '' }}
                sharePath={videoRoute}
                icon="send"
                dropdownInPortal
                className="feed-video-share-wrapper"
                buttonClassName="feed-video-share-button"
              />
            </>
          ) : null}
        </div>
        <button
          type="button"
          className={`feed-video-card-fav ${saved ? 'active' : ''}`}
          aria-label="Wishlist"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(item.videoId, wishlistType);
          }}
        >
          <i className={`${saved ? 'fa-solid' : 'fa-regular'} fa-heart`} aria-hidden="true" />
        </button>
      </div>
      {!isShorts ? (
        <MovieComments
          ref={commentsRef}
          movieId={`music:${String(item.videoId)}`}
          targetType={commentType}
          modalOnly
          onCountChange={setCommentsCount}
        />
      ) : null}
    </div>
  );
};

export default FeedVideoCard;
