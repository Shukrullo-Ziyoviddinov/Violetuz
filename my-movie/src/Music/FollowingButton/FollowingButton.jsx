import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useFollowing, useIsFollowing } from '../../context/FollowingContext';
import { requestOpenAuthModal } from '../../authModalBridge';
import Toast from '../../components/Toast/Toast';
import './FollowingButton.css';

const stopEventBubble = (e) => {
  e.stopPropagation();
};

/**
 * FollowingButton — aktyor / artist obuna.
 *
 * @param {string|number} artistId — target id
 * @param {'actor'|'artist'} [entityType='artist'] — DB type
 */
const FollowingButton = ({
  artistId,
  entityType = 'artist',
  wrapperClassName = '',
  stopPropagation = false,
  onSubscribeChange,
}) => {
  const { i18n } = useTranslation();
  const { isLoggedIn } = useAuth();
  const { follow, unfollow } = useFollowing();
  const type = entityType === 'actor' ? 'actor' : 'artist';
  const isFollowing = useIsFollowing(artistId, type);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    onSubscribeChange?.(isFollowing);
  }, [isFollowing, onSubscribeChange]);

  const handleClick = useCallback(
    (e) => {
      if (stopPropagation) e.stopPropagation();
      if (!isLoggedIn) {
        setShowToast(true);
        requestOpenAuthModal('register');
        return;
      }
      if (artistId == null || artistId === '') return;
      if (isFollowing) {
        unfollow(artistId, type);
      } else {
        follow(artistId, type);
      }
    },
    [stopPropagation, isLoggedIn, artistId, isFollowing, unfollow, follow, type]
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
    subscribeLabel = "Obuna bo'lish";
    followingLabel = "Obuna bo'ldi";
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
