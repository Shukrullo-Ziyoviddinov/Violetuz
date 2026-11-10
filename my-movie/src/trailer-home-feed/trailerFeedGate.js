import { fetchTrailerFeedPage } from './feedApi';

const gates = new Map();

export function resetTrailerFeedGate(viewer) {
  if (viewer == null) gates.clear();
  else gates.delete(viewer);
}

/**
 * Birinchi so‘rov sessiyani ochadi. Keyingilari shu sahifani qayta o‘qiydi.
 * Abort bo‘lgan ochuvchi yangi sessiyani o‘chirmaydi.
 */
export async function fetchTrailerSlice({ isLoggedIn, signal, offset = 0, limit, viewer, cursor }) {
  if (cursor) return fetchTrailerFeedPage({ isLoggedIn, signal, cursor, offset, limit });
  const key = viewer || (isLoggedIn ? 'account' : 'guest');
  let gate = gates.get(key);
  if (!gate) {
    let resolveCursor;
    const ready = new Promise((resolve) => { resolveCursor = resolve; });
    gate = { cursor: null, ready, resolveCursor, opening: null };
    gates.set(key, gate);
  }
  if (gate.cursor) return fetchTrailerFeedPage({ isLoggedIn, signal, cursor: gate.cursor, offset, limit });
  if (gate.opening) {
    const shared = await gate.ready;
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!shared) return fetchTrailerFeedPage({ isLoggedIn, signal, offset, limit });
    return fetchTrailerFeedPage({ isLoggedIn, signal, cursor: shared, offset, limit });
  }
  const opening = gate;
  opening.opening = (async () => {
    try {
      const page = await fetchTrailerFeedPage({ isLoggedIn, signal, offset, limit });
      opening.cursor = page?.pageCursor || null;
      opening.resolveCursor(opening.cursor);
      if (!opening.cursor && gates.get(key) === opening) gates.delete(key);
      return page;
    } catch (error) {
      if (gates.get(key) === opening) gates.delete(key);
      opening.resolveCursor(null);
      throw error;
    } finally {
      opening.opening = null;
    }
  })();
  return opening.opening;
}
