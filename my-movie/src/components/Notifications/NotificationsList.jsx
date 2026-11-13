import React from 'react';
import { useTranslation } from 'react-i18next';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import UserAvatar from '../UserAvatar/UserAvatar';
import { actorInitials, formatNoticeTime } from './notificationView';

const AVATAR_COLORS = ['#f97316', '#7c3aed', '#0313ea', '#0ea5e9', '#16a34a', '#e11d48'];

const avatarColor = (id) => {
  const text = String(id || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash + text.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
};

const NotificationsList = ({ items }) => {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';

  return (
    <ul className="notifications-list">
      {items.map((item) => {
        if (item.type !== 'subscriber') return null;
        const name = item.actor?.name || item.actor?.username || '';
        const phrase = lang === 'ru' ? 'подписался на вас' : 'sizga obuna bo‘ldi';
        const initials = actorInitials(name);
        return (
          <li key={item.id} className="notifications-row">
            <UserAvatar
              src={item.actor?.avatar}
              className="notifications-row-avatar"
              alt=""
              fallback={
                <span
                  className="notifications-row-avatar notifications-row-fallback"
                  style={{ background: avatarColor(item.actor?.id) }}
                  aria-hidden="true"
                >
                  {initials}
                </span>
              }
            />
            <div className="notifications-row-copy">
              <p className="notifications-row-text">
                {name ? <strong>{name}</strong> : null}
                {name ? ' ' : ''}
                {phrase}
              </p>
              <time className="notifications-row-time" dateTime={item.createdAt}>
                {formatNoticeTime(item.createdAt, lang)}
              </time>
            </div>
            {item.actor?.id ? (
              <FollowingButton
                artistId={item.actor.id}
                entityType="user"
                stopPropagation
                wrapperClassName="notifications-row-follow"
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
};

export default NotificationsList;
