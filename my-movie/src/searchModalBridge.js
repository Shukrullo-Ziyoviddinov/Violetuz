export const OPEN_SEARCH_EVENT = 'violet-open-search';

export function requestOpenSearchModal() {
  window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
}
