import UserAvatar from '../components/UserAvatar/UserAvatar';

const AvatarFallback = () => (
  <svg
    className="profile-avatar-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ProfileCompactIdentity = ({ name, username, avatar, visible }) => (
  <div className="profile-mobile-bar-identity" aria-hidden={!visible}>
    <div className="profile-mobile-bar-avatar">
      <UserAvatar
        src={avatar}
        className="profile-avatar-img"
        fallback={<AvatarFallback />}
      />
    </div>
    <div className="profile-mobile-bar-meta">
      <div className="profile-name">
        <span className="profile-name-text">{name}</span>
      </div>
      {username ? <div className="profile-username">{username}</div> : null}
    </div>
  </div>
);

export default ProfileCompactIdentity;
