import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { fetchMessageSelf } from '../../api/messagesApi';
import MessageFilter from './MessageFilter';
import MessageInbox from './MessageInbox';
import RomLiveUser from './RomLiveUser';
import {
  getNotificationUnread,
  NOTIFICATIONS_UNREAD_EVENT,
  requestOpenNotifications,
} from '../../notificationModalBridge';
import './Message.css';

const Message = () => {
  const { t } = useTranslation();
  const { isLoggedIn, authReady } = useAuth();
  const [filter, setFilter] = useState('chats');
  const [self, setSelf] = useState(null);
  const [unread, setUnread] = useState(getNotificationUnread);
  const badge = unread > 99 ? '99+' : String(unread);
  const bellLabel = t('navbar.notifications', 'Bildirishnomalar');

  useEffect(() => {
    const onUnread = (event) => setUnread(Number(event.detail) || 0);
    window.addEventListener(NOTIFICATIONS_UNREAD_EVENT, onUnread);
    return () => window.removeEventListener(NOTIFICATIONS_UNREAD_EVENT, onUnread);
  }, []);

  useEffect(() => {
    if (!authReady || !isLoggedIn) {
      setSelf(null);
      return undefined;
    }
    let cancelled = false;
    fetchMessageSelf()
      .then((card) => {
        if (!cancelled) setSelf(card?.id && card?.name ? card : null);
      })
      .catch(() => {
        if (!cancelled) setSelf(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn]);

  return (
    <section className="message" aria-labelledby="message-page-title">
      <header className="message-bar">
        <h1 id="message-page-title" className="message-title">
          {t('navbar.messages', 'Xabarlar')}
        </h1>
        <div className="message-actions">
          <button type="button" className="message-icon-btn" aria-label={t('navbar.search', 'Qidirish')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className="message-icon-btn message-bell-btn"
            aria-label={unread > 0 ? `${bellLabel}, ${badge}` : bellLabel}
            onClick={requestOpenNotifications}
          >
            <i className="fa-solid fa-bell" aria-hidden="true" />
            {unread > 0 ? <span className="notifications-badge">{badge}</span> : null}
          </button>
        </div>
      </header>
      <RomLiveUser self={self} />
      <MessageFilter active={filter} onChange={setFilter} />
      {filter === 'chats' ? <MessageInbox /> : null}
    </section>
  );
};

export default Message;
