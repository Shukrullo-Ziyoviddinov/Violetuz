import React from 'react';
import { useNavigate } from 'react-router-dom';
import LikeButton from '../../Music/LikeButton/LikeButton';
import { useWishlist } from '../../context/WishlistContext';
import './FeedVideoCard.css';

const FeedVideoCard = ({ item }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlistType = item.wishlistType || 'klip';
  const saved = isInWishlist(item.videoId, wishlistType);

  return (
    <div className="feed-video-card" onClick={() => navigate(item.route || `/music/video/${item.videoId}`)} role="button" tabIndex={0}>
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
        {item.type === 'movieShorts' || item.type === 'musicshorts' ? (
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
              route: item.route || `/music/video/${item.videoId}`,
            }}
          />
        )}
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
    </div>
  );
};

export default FeedVideoCard;
