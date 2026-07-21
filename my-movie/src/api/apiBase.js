const normalizeApiBaseUrl = (url) => {
  const trimmed = String(url || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const resolveApiBaseUrl = () => {
  if (process.env.REACT_APP_MOVIE_API_URL) {
    return normalizeApiBaseUrl(process.env.REACT_APP_MOVIE_API_URL);
  }

  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5000/api';
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  return 'http://localhost:5000/api';
};
