import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast/Toast';
import './FollowingButton.css';

/**
 * FollowingButton - Ijrochiga obuna bo'lish tugmasi
 * Backend API ulanganda oson o'zgartirish uchun:
 * - subscribeArtist / unsubscribeArtist funksiyalari API chaqiruvlari bilan almashtiriladi
 * - FOLLOWING_STORAGE_KEY o'rniga API dan ma'lumot olinadi
 */
const FOLLOWING_STORAGE_KEY = 'violet_following_artists';

const getFollowingIds = () => {
  try {
    const stored = localStorage.getItem(FOLLOWING_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {}
  return [];
};

const saveFollowingIds = (ids) => {
  localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify(ids));
};

const FollowingButton = ({ artistId, subscriberCount = 0, onSubscribeChange }) => {
  const { t, i18n } = useTranslation();
  const { isLoggedIn } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [count, setCount] = useState(subscriberCount);
  const [showToast, setShowToast] = useState(false);
  const [followingIds, setFollowingIds] = useState([]);

  useEffect(() => {
    const ids = getFollowingIds();
    setFollowingIds(ids);
    const following = ids.includes(artistId);
    setIsFollowing(following);
    onSubscribeChange?.(following);
  }, [artistId, onSubscribeChange]);

  useEffect(() => {
    setCount(subscriberCount);
  }, [subscriberCount]);

  const subscribeArtist = useCallback(
    async (artistIdToSubscribe) => {
      // Backend ulanganida:
      // const res = await api.post(`/artists/${artistIdToSubscribe}/follow`);
      // subscriberCount API javobidan olinadi (res.data.subscribers)
      // Lokal +1 o'rniga API dan yangilangan count ishlatiladi
      const next = [...new Set([...followingIds, artistIdToSubscribe])];
      saveFollowingIds(next);
      setFollowingIds(next);
      setIsFollowing(true);
      setCount((c) => c + 1);
      onSubscribeChange?.(true);
    },
    [followingIds, onSubscribeChange]
  );

  const unsubscribeArtist = useCallback(
    async (artistIdToUnsubscribe) => {
      // Backend ulanganida: await api.delete(`/artists/${artistIdToUnsubscribe}/follow`)
      const next = followingIds.filter((id) => id !== artistIdToUnsubscribe);
      saveFollowingIds(next);
      setFollowingIds(next);
      setIsFollowing(false);
      setCount((c) => Math.max(0, c - 1));
      onSubscribeChange?.(false);
    },
    [followingIds, onSubscribeChange]
  );

  const handleClick = () => {
    if (!isLoggedIn) {
      setShowToast(true);
      return;
    }
    if (isFollowing) {
      unsubscribeArtist(artistId);
    } else {
      subscribeArtist(artistId);
    }
  };

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

  return (
    <>
      <button
        type="button"
        className={`following-btn ${isFollowing ? 'following-btn--active' : ''}`}
        onClick={handleClick}
        aria-pressed={isFollowing}
        aria-label={isFollowing ? followingLabel : subscribeLabel}
      >
        {isFollowing ? followingLabel : subscribeLabel}
      </button>
      {showToast && (
        <Toast
          messageKey="notRegistered"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};

export default FollowingButton;
