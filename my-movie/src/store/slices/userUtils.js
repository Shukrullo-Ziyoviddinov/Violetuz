export const PROFILE_STORAGE_KEY = 'violet_profile';
export const AUTH_STORAGE_KEY = 'violet_user_authenticated';

export const DEFAULT_PROFILE = {
  name: 'Shukrullo',
  username: 'Aliyov',
  bio: '',
  avatar: null,
};

/** @siz saqlanadi; ko‘rinishda @ qo‘shiladi */
export const normalizeUsername = (raw) => (raw ?? '').trim().replace(/^@+/, '').trim();

export const parseStoredProfile = (parsed) => {
  if (!parsed || typeof parsed !== 'object') {
    return { ...DEFAULT_PROFILE };
  }
  const usernameRaw = parsed.username ?? parsed.surname ?? '';
  const username =
    normalizeUsername(usernameRaw) ||
    normalizeUsername(DEFAULT_PROFILE.username) ||
    DEFAULT_PROFILE.username;
  const bio = (parsed.bio ?? parsed.phone ?? '').trim() || DEFAULT_PROFILE.bio;
  return {
    name: parsed.name?.trim() || DEFAULT_PROFILE.name,
    username,
    bio,
    avatar: parsed.avatar ?? null,
  };
};

export const loadLegacyUserState = () => {
  let profile = { ...DEFAULT_PROFILE };
  let isLoggedIn = false;

  try {
    const profileRaw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (profileRaw) {
      profile = parseStoredProfile(JSON.parse(profileRaw));
      isLoggedIn = true;
    }
  } catch {
    /* ignore */
  }

  try {
    const authRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authRaw === 'true') {
      isLoggedIn = true;
    }
  } catch {
    /* ignore */
  }

  return { isLoggedIn, profile };
};
