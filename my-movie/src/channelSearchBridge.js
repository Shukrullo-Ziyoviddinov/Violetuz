export const OPEN_CHANNEL_SEARCH_EVENT = 'violet-open-channel-search';

export function requestOpenChannelSearch() {
  window.dispatchEvent(new CustomEvent(OPEN_CHANNEL_SEARCH_EVENT));
}
