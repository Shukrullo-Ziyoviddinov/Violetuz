import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './NotificationsFilter.css';

const FILTERS = [
  { id: 'all', uz: 'Hammasi', ru: 'Все' },
  { id: 'reminders', uz: 'Eslatmalar', ru: 'Напоминания' },
  { id: 'subscriptions', uz: 'Obunalar', ru: 'Подписки' },
  { id: 'mentions', uz: 'Zikrlar', ru: 'Упоминания' },
];

const NotificationsFilter = () => {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';

  return (
    <ScrollTouch className="notifications-filter" aria-label={lang === 'ru' ? 'Фильтр' : 'Filtr'}>
      {FILTERS.map((item) => (
        <button key={item.id} type="button" className="notifications-filter-btn">
          {item[lang]}
        </button>
      ))}
    </ScrollTouch>
  );
};

export default NotificationsFilter;
