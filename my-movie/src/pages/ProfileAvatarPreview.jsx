import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FollowingButton from '../Music/FollowingButton/FollowingButton';
import ShareButton from '../components/ShareButton/ShareButton';
import UserAvatar from '../components/UserAvatar/UserAvatar';
import { useModalHardwareBack } from '../useModalHardwareBack';
import { normalizeUsername, profileShareText } from '../store/slices/userUtils';

const COVER = '/img/profilfoto.jpg';

const FallbackIcon = () => (
  <svg
    className="profile-avatar-icon"
    width="96"
    height="96"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ProfileAvatarPreview = ({ user, onClose, onSubscribeChange }) => {
  const handle = normalizeUsername(user?.username) || user?.name || '';
  const avatarSrc = typeof user?.avatar === 'string' ? user.avatar.trim() : '';
  const background = avatarSrc || COVER;

  const { releaseHistory } = useModalHardwareBack({
    historyKey: 'profileAvatarPreview',
    isOpen: true,
    onCloseFromHardware: onClose,
  });

  const requestClose = () => {
    releaseHistory();
    onClose();
  };

  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.classList.add('profile-avatar-preview-open');
    document.body.style.overflow = 'hidden';

    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (document.querySelector('.share-modal-overlay')) return;
      requestCloseRef.current();
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('profile-avatar-preview-open');
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return createPortal(
    <div className="profile-avatar-preview" role="dialog" aria-modal="true" aria-label={user?.name || handle}>
      <div className="profile-avatar-preview-bg" style={{ backgroundImage: `url(${background})` }} />
      <div className="profile-avatar-preview-dim" />

      <header className="profile-avatar-preview-header">
        <button type="button" className="profile-avatar-preview-back" onClick={requestClose} aria-label="Ortga">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="profile-avatar-preview-handle">{handle}</span>
        <span className="profile-avatar-preview-header-spacer" aria-hidden="true" />
      </header>

      <div className="profile-avatar-preview-stage">
        <div className="profile-avatar-preview-watermark">{user?.name}</div>
        <div className="profile-avatar-preview-circle">
          <UserAvatar src={avatarSrc} className="profile-avatar-preview-photo" alt="" fallback={<FallbackIcon />} />
        </div>
      </div>

      <div className="profile-avatar-preview-dock">
        <div className="profile-avatar-preview-actions">
          <FollowingButton
            artistId={user?.id}
            entityType="user"
            wrapperClassName="profile-avatar-preview-follow"
            onSubscribeChange={onSubscribeChange}
          />
          <button type="button" className="profile-avatar-preview-message">
            Xabar
          </button>
          <ShareButton
            icon="send"
            className="profile-avatar-preview-share"
            buttonClassName="profile-avatar-preview-share-btn"
            movie={{ title: profileShareText(user) }}
            sharePath={`/user/${encodeURIComponent(user?.id || '')}`}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileAvatarPreview;
