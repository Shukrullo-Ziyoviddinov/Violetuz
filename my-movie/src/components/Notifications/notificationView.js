import { formatCommentTimeAgo } from '../../utils/utils';

const SUBSCRIPTION_TYPE = 'subscriber';

export const itemsForFilter = (items, filterId) => {
  const list = Array.isArray(items) ? items : [];
  if (filterId === 'all') return list;
  if (filterId === 'subscriptions') {
    return list.filter((item) => item?.type === SUBSCRIPTION_TYPE);
  }
  return [];
};

export const formatNoticeTime = (value, lang) =>
  formatCommentTimeAgo(value, lang).replace(/ oldin$/, '').replace(/ назад$/, '');

export const actorInitials = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};
