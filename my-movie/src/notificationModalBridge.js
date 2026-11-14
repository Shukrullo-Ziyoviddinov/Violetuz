export const OPEN_NOTIFICATIONS_EVENT = 'violet-open-notifications';
export const NOTIFICATIONS_UNREAD_EVENT = 'violet-notifications-unread';

let unreadCount = 0;

export function requestOpenNotifications() {
  window.dispatchEvent(new CustomEvent(OPEN_NOTIFICATIONS_EVENT));
}

export function getNotificationUnread() {
  return unreadCount;
}

export function publishNotificationUnread(count) {
  unreadCount = Math.max(0, Number(count) || 0);
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UNREAD_EVENT, { detail: unreadCount }));
}
