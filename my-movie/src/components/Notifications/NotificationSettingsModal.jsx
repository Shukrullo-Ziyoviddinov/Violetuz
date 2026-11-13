import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './NotificationSettingsModal.css';

const SECTIONS = [
  {
    id: 'social',
    uz: 'IJTIMOIY',
    ru: 'СОЦИАЛЬНЫЕ',
    items: [
      {
        id: 'mentions',
        uz: 'Belgilash va javoblar',
        ru: 'Отметки и ответы',
        hintUz: 'Izohda @ qilinganda',
        hintRu: 'Когда отмечают в комментарии',
        defaultOn: true,
      },
      {
        id: 'subscribers',
        uz: 'Yangi obunachilar',
        ru: 'Новые подписчики',
        hintUz: "Kimdir obuna bo'lganda",
        hintRu: 'Когда кто-то подписывается',
        defaultOn: true,
      },
      {
        id: 'likes',
        uz: 'Yoqtirishlar',
        ru: 'Отметки нравится',
        hintUz: 'Fikr va izohlarga',
        hintRu: 'На мысли и комментарии',
        defaultOn: false,
      },
      {
        id: 'rooms',
        uz: 'Xona takliflari',
        ru: 'Приглашения в комнату',
        hintUz: "Do'stlar chaqirganda",
        hintRu: 'Когда зовут друзья',
        defaultOn: true,
      },
    ],
  },
  {
    id: 'movies',
    uz: 'KINO VA TAVSIYA',
    ru: 'КИНО И РЕКОМЕНДАЦИИ',
    items: [
      {
        id: 'ai',
        uz: 'AI kechki tavsiya',
        ru: 'Вечерняя рекомендация',
        hintUz: "Ko'rish odatingiz asosida",
        hintRu: 'На основе ваших просмотров',
        defaultOn: true,
      },
      {
        id: 'channels',
        uz: "Obuna bo'lgan kanallar",
        ru: 'Каналы в подписках',
        hintUz: 'Yangi video va qismlar',
        hintRu: 'Новые видео и серии',
        defaultOn: true,
      },
      {
        id: 'artists',
        uz: 'Kuzatilgan artistlar',
        ru: 'Отслеживаемые артисты',
        hintUz: 'Yangi klip chiqqanda',
        hintRu: 'Когда выходит новый клип',
        defaultOn: true,
      },
    ],
  },
];

const initialToggles = () =>
  Object.fromEntries(
    SECTIONS.flatMap((section) => section.items.map((item) => [item.id, item.defaultOn]))
  );

const NotificationSettingsModal = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';
  const [toggles, setToggles] = useState(initialToggles);

  return (
    <div className="notification-settings" role="dialog" aria-modal="true" aria-labelledby="notification-settings-title">
      <div className="profile-info-modal-header notification-settings-header">
        <button
          type="button"
          className="profile-info-back"
          onClick={onClose}
          aria-label={t('profile.settingsBack', 'Orqaga')}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 id="notification-settings-title" className="profile-info-modal-title">
          {t('navbar.notifications', 'Bildirishnomalar')}
        </h2>
        <span className="profile-info-header-spacer" aria-hidden="true" />
      </div>

      <div className="notification-settings-body">
        {SECTIONS.map((section) => (
          <section key={section.id} className="notification-settings-section">
            <h3 className="notification-settings-label">{lang === 'ru' ? section.ru : section.uz}</h3>
            {section.items.map((item) => {
              const on = toggles[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  className="notification-settings-row"
                  aria-pressed={on}
                  onClick={() => setToggles((current) => ({ ...current, [item.id]: !current[item.id] }))}
                >
                  <span className="notification-settings-copy">
                    <span className="notification-settings-title">{lang === 'ru' ? item.ru : item.uz}</span>
                    <span className="notification-settings-hint">{lang === 'ru' ? item.hintRu : item.hintUz}</span>
                  </span>
                  <span className={`notification-settings-switch${on ? ' is-on' : ''}`} aria-hidden="true">
                    <span />
                  </span>
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettingsModal;
