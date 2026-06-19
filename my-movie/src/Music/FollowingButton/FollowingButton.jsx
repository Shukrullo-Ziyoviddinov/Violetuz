import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useFollowing, useIsFollowing } from '../../context/FollowingContext';
import Toast from '../../components/Toast/Toast';
import './FollowingButton.css';

const stopEventBubble = (e) => {
  e.stopPropagation();
};

/**
 * FollowingButton — barcha obuna tugmalari (aktyor, artist, profil, video, feed)
 * Redux: followingSlice orqali `violet_following_artists` da saqlanadi
 *
 * @param {string|number} artistId — aktyor yoki artist id
 * @param {string} [wrapperClassName] — `.recommended-actors-follow`, `.video-detail-artist-card-btn` va h.k.
 * @param {boolean} [stopPropagation] — karta ichida bosilganda navigatsiyani to'xtatish
 * @param {function} [onSubscribeChange] — obuna holati o'zgarganda (masalan, obunachilar soni)
 */
const FollowingButton = ({
  artistId,
  wrapperClassName = '',
  stopPropagation = false,
  onSubscribeChange,
}) => {
  const { i18n } = useTranslation();
  const { isLoggedIn } = useAuth();
  const { follow, unfollow } = useFollowing();
  const isFollowing = useIsFollowing(artistId);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    onSubscribeChange?.(isFollowing);
  }, [isFollowing, onSubscribeChange]);

  const handleClick = useCallback(
    (e) => {
      if (stopPropagation) e.stopPropagation();
      if (!isLoggedIn) {
        setShowToast(true);
        return;
      }
      if (artistId == null || artistId === '') return;
      if (isFollowing) {
        unfollow(artistId);
      } else {
        follow(artistId);
      }
    },
    [stopPropagation, isLoggedIn, artistId, isFollowing, unfollow, follow]
  );

  const lang = i18n.language || '';
  const isRu = lang.startsWith('ru');
  const isUz = lang.startsWith('uz');
  let subscribeLabel;
  let followingLabel;
  if (isRu) {
    subscribeLabel = 'Подписаться';
    followingLabel = 'Отписаться';
  } else if (isUz) {
    subscribeLabel = '+ Obuna';
    followingLabel = '- Bekor qilish';
  } else {
    subscribeLabel = 'Obuna bo\'lish';
    followingLabel = 'Obuna bo\'ldi';
  }

  const button = (
    <button
      type="button"
      className={`following-btn ${isFollowing ? 'following-btn--active' : ''}`}
      onClick={handleClick}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? followingLabel : subscribeLabel}
    >
      {isFollowing ? followingLabel : subscribeLabel}
    </button>
  );

  const toast = showToast ? (
    <Toast messageKey="notRegistered" onClose={() => setShowToast(false)} />
  ) : null;

  if (wrapperClassName) {
    return (
      <div
        className={wrapperClassName}
        onClick={stopPropagation ? stopEventBubble : undefined}
        onKeyDown={stopPropagation ? stopEventBubble : undefined}
        role="presentation"
      >
        {button}
        {toast}
      </div>
    );
  }

  return (
    <>
      {button}
      {toast}
    </>
  );
};

export default FollowingButton;
