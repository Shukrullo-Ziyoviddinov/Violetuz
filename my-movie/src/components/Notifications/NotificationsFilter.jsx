import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './NotificationsFilter.css';

export const NOTIFICATION_FILTERS = [
  {
    id: 'all',
    uz: 'Hammasi',
    ru: 'Все',
    icon: 'fa-bell',
    emptyUz: 'Sizda hozirda bildirishnomalar mavjud emas',
    emptyRu: 'У вас пока нет уведомлений',
  },
  {
    id: 'reminders',
    uz: 'Eslatmalar',
    ru: 'Напоминания',
    icon: 'fa-clock',
    emptyUz: 'Hozirda eslatmalar mavjud emas',
    emptyRu: 'Напоминаний пока нет',
  },
  {
    id: 'subscriptions',
    uz: 'Obunalar',
    ru: 'Подписки',
    icon: 'fa-user-plus',
    emptyUz: 'Yangi obunalar mavjud emas',
    emptyRu: 'Новых подписок нет',
  },
  {
    id: 'mentions',
    uz: 'Zikrlar',
    ru: 'Упоминания',
    icon: 'fa-at',
    emptyUz: 'Hali zikr qilinmagansiz',
    emptyRu: 'Вас ещё не упоминали',
  },
];

const NotificationsFilter = ({ active, onChange }) => {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';

  return (
    <ScrollTouch className="notifications-filter" role="tablist" aria-label={lang === 'ru' ? 'Фильтр' : 'Filtr'}>
      {NOTIFICATION_FILTERS.map((item) => {
        const selected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`notifications-filter-btn${selected ? ' notifications-filter-btn--active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item[lang]}
          </button>
        );
      })}
    </ScrollTouch>
  );
};

export default NotificationsFilter;
