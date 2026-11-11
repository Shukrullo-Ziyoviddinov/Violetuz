import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const publicProfileFetch = (path, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...options.headers,
    },
  });

const parseJson = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || body?.success === false) {
    const err = new Error(body?.message || 'Public profile request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/** @returns {Promise<{ user: object|null, reposts: Array<object>, following: Array<object>, followers: Array<object> }>} */
export const fetchPublicProfile = async (id) => {
  const userId = String(id || '').trim();
  if (!userId) {
    const err = new Error('Foydalanuvchi topilmadi');
    err.status = 404;
    throw err;
  }

  const data = await parseJson(
    await publicProfileFetch(`/users/${encodeURIComponent(userId)}`)
  );

  return {
    user: data?.user ?? null,
    reposts: Array.isArray(data?.reposts) ? data.reposts : [],
    following: Array.isArray(data?.following) ? data.following : [],
    followers: Array.isArray(data?.followers) ? data.followers : [],
  };
};
