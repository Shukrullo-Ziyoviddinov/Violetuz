export const OPEN_MESSAGES_EVENT = 'violet-open-messages';

export function requestOpenMessagesModal() {
  window.dispatchEvent(new CustomEvent(OPEN_MESSAGES_EVENT));
}
