/**
 * Backend API konfiguratsiyasi
 * .env faylida REACT_APP_BASE_URL o'rnatilsa, shu URL ishlatiladi
 */
export const BASE_URL = process.env.REACT_APP_BASE_URL || 
  (typeof window !== 'undefined' ? window.location.origin : '');

export const getShareUrl = (path = '') => {
  const base = BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
};
