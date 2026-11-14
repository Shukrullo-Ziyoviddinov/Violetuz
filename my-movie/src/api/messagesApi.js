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
    const err = new Error(body?.message || 'Message request failed');
    err.status = response.status;
    throw err;
  }
  return body?.data ?? body;
};

export const fetchMessageSelf = async () => {
  const response = await fetch(`${API_BASE_URL}/messages/me`, {
    credentials: 'include',
  });
  return parseJson(response);
};
