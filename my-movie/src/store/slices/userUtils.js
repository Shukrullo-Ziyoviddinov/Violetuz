export const PROFILE_STORAGE_KEY = 'violet_profile';

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

/** Faqat profil cache (auth cookie’da) */
export const loadLegacyUserState = () => {
  let profile = { ...DEFAULT_PROFILE };

  try {
    const profileRaw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (profileRaw) {
      profile = parseStoredProfile(JSON.parse(profileRaw));
    }
  } catch {
    /* ignore */
  }

  // Eski localStorage tokenlarni tozalash
  try {
    localStorage.removeItem('violet_auth_token');
    localStorage.removeItem('violet_user_authenticated');
  } catch {
    /* ignore */
  }

  return {
    isLoggedIn: false,
    profile,
    authReady: false,
  };
};

export const writeProfileCache = (profile) => {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  } catch {
    /* ignore */
  }
};

export const clearAuthStorage = () => {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem('violet_auth_token');
    localStorage.removeItem('violet_user_authenticated');
  } catch {
    /* ignore */
  }
};
