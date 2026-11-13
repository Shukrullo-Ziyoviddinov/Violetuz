import React from 'react';
import { useTranslation } from 'react-i18next';
import { NOTIFICATION_FILTERS } from './NotificationsFilter';

const NotificationsEmpty = ({ filterId }) => {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';
  const filter = NOTIFICATION_FILTERS.find((item) => item.id === filterId) || NOTIFICATION_FILTERS[0];

  return (
    <div className="notifications-empty">
      <i className={`fa-solid ${filter.icon}`} aria-hidden="true" />
      <p className="notifications-empty-text">{lang === 'ru' ? filter.emptyRu : filter.emptyUz}</p>
    </div>
  );
};

export default NotificationsEmpty;
