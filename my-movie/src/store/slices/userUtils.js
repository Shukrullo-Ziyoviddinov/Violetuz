export const PROFILE_STORAGE_KEY = 'violet_profile';
export const AUTH_STORAGE_KEY = 'violet_user_authenticated';
export const AUTH_TOKEN_KEY = 'violet_auth_token';

export const DEFAULT_PROFILE = {
  name: '',
  username: '',
  bio: '',
  avatar: null,
  email: '',
};

/** @siz saqlanadi; ko‘rinishda @ qo‘shiladi */
export const normalizeUsername = (raw) => (raw ?? '').trim().replace(/^@+/, '').trim();

export const parseStoredProfile = (parsed) => {
  if (!parsed || typeof parsed !== 'object') {
    return { ...DEFAULT_PROFILE };
  }
  const usernameRaw = parsed.username ?? parsed.surname ?? '';
  const username = normalizeUsername(usernameRaw);
  const bio = (parsed.bio ?? parsed.phone ?? '').trim() || '';
  return {
    name: parsed.name?.trim() || '',
    username,
    bio,
    avatar: parsed.avatar ?? null,
    email: parsed.email?.trim() || '',
  };
};

export const loadLegacyUserState = () => {
  let profile = { ...DEFAULT_PROFILE };
  let isLoggedIn = false;
  let token = null;

  try {
    const profileRaw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (profileRaw) {
      profile = parseStoredProfile(JSON.parse(profileRaw));
    }
  } catch {
    /* ignore */
  }

  try {
    const authRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    const tokenRaw = localStorage.getItem(AUTH_TOKEN_KEY);
    if (authRaw === 'true' && tokenRaw) {
      isLoggedIn = true;
      token = tokenRaw;
    }
  } catch {
    /* ignore */
  }

  return { isLoggedIn, profile, token };
};
