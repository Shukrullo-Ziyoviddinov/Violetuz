import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

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

export const checkUsernameAvailable = async (username) => {
  const q = encodeURIComponent(String(username || '').trim());
  const res = await fetch(`${API_BASE_URL}/auth/username-available?username=${q}`);
  return parseJson(res);
};

export const registerStart = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/auth/register/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

export const registerVerify = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/auth/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

export const loginStart = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/auth/login/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

export const loginVerify = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/auth/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};

export const loginWithUsername = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/auth/login/username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
};
