import { resolveApiBaseUrl } from '../../api/apiBase';
import { createGuestTrailerProgressStore } from '../progress/guestTrailerProgress';
import { createGuestTrailerSignalStore } from './guestTrailerSignals';
import { parseTrailerIdentity, validateSignalAction } from './signalProtocol';

const guest = createGuestTrailerSignalStore();
const guestProgress = createGuestTrailerProgressStore();
const request = async (path, options = {}) => {
  const response = await fetch(`${resolveApiBaseUrl()}/trailer-home-signals${path}`, {
    credentials: 'include', ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) {
    const error = new Error(body?.message || 'Trailer signal request failed');
    error.status = response.status;
    throw error;
  }
  return body?.data;
};

export async function saveTrailerSignal({ isLoggedIn, action }) {
  if (typeof isLoggedIn !== 'boolean') throw new TypeError('Resolved authentication state is required');
  const valid = validateSignalAction(action);
  if (!isLoggedIn) return guest.save(valid);
  return { stored: 'account', ...await request('', { method: 'POST', body: JSON.stringify(valid) }) };
}

export async function readTrailerSignals({ isLoggedIn, movieId, trailerId }) {
  if (typeof isLoggedIn !== 'boolean') throw new TypeError('Resolved authentication state is required');
  const ids = parseTrailerIdentity({ movieId, trailerId });
  if (!isLoggedIn) return { ...ids, todayActions: guest.today(ids.movieId, ids.trailerId),
    lifetimeWatch: guestProgress.read(ids.movieId, ids.trailerId), currentReaction: 'none' };
  return request(`/${ids.movieId}/${ids.trailerId}`);
}
