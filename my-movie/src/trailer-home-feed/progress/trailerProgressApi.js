import { resolveApiBaseUrl } from '../../api/apiBase';
import { validateProgressReport } from './progressProtocol';
import { createGuestTrailerProgressStore } from './guestTrailerProgress';

const guest = createGuestTrailerProgressStore();
const request = async (path, options = {}) => {
  const response = await fetch(`${resolveApiBaseUrl()}/trailer-home-progress${path}`, {
    credentials: 'include', ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true) {
    const error = new Error(body?.message || 'Trailer progress request failed');
    error.status = response.status;
    throw error;
  }
  return body?.data;
};

// Explicit identity state is required: never interpret "auth not ready" as guest.
export async function saveTrailerProgress({ isLoggedIn, report, signal, accountId }) {
  if (typeof isLoggedIn !== 'boolean') throw new TypeError('Resolved authentication state is required');
  const valid = validateProgressReport(report);
  if (!isLoggedIn) return guest.save(valid);
  const result = await request('', { method: 'POST',
    body: JSON.stringify({ ...valid, ...(accountId ? { expectedAccountId: String(accountId) } : {}) }), keepalive: true, signal });
  // On account errors do not write to guest history or import guest sessions.
  return { stored: 'account', ...result };
}

export async function readTrailerProgress({ isLoggedIn, movieId, trailerId }) {
  if (typeof isLoggedIn !== 'boolean') throw new TypeError('Resolved authentication state is required');
  if (![movieId, trailerId].every((value) => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0)) {
    throw new TypeError('Invalid trailer identity');
  }
  if (!isLoggedIn) return guest.read(movieId, trailerId);
  return request(`/${encodeURIComponent(movieId)}/${encodeURIComponent(trailerId)}`);
}
