import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const authFetch = (path, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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
    const err = new Error(body?.message || 'Auth request failed');
    err.status = response.status;
    err.details = body?.details;
    err.field = body?.details?.field;
    throw err;
  }
  return body?.data ?? body;
};

export const checkUsernameAvailable = async (username, { excludeSelf = false } = {}) => {
  const q = encodeURIComponent(String(username || '').trim());
  const exclude = excludeSelf ? '&excludeSelf=1' : '';
  const res = await authFetch(`/auth/username-available?username=${q}${exclude}`);
  return parseJson(res);
};

export const registerStart = async (payload) => {
  const res = await authFetch('/auth/register/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

export const registerVerify = async (payload) => {
  const res = await authFetch('/auth/register/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

export const loginStart = async (payload) => {
  const res = await authFetch('/auth/login/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

export const loginVerify = async (payload) => {
  const res = await authFetch('/auth/login/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

export const loginWithUsername = async (payload) => {
  const res = await authFetch('/auth/login/username', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

/** Cookie sessiyasidan joriy userni olish */
export const fetchMe = async () => {
  const res = await authFetch('/auth/me');
  return parseJson(res);
};

export const logoutRequest = async () => {
  const res = await authFetch('/auth/logout', { method: 'POST' });
  return parseJson(res);
};

/** Qurilmadagi boshqa hisobga o‘tish (httpOnly device cookie + userId) */
export const switchAccountRequest = async ({ userId }) => {
  const res = await authFetch('/auth/switch', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
  return parseJson(res);
};

/** Shu qurilmaga bog‘langan hisoblar (server manba) */
export const fetchDeviceAccounts = async () => {
  const res = await authFetch('/auth/device-accounts');
  return parseJson(res);
};

export const updateProfileRequest = async (payload) => {
  const res = await authFetch('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};
