/** Qurilmadagi ko‘p hisoblar — faqat metadata (JWT yo‘q). Switch server device cookie orqali. */
export const ACCOUNTS_STORAGE_KEY = 'violet_accounts';

const emptyState = () => ({
  accounts: [],
  activeId: null,
});

const sanitizeAccount = (a) => {
  if (!a || !a.id) return null;
  return {
    id: String(a.id),
    name: String(a.name || '').trim(),
    username: String(a.username || '')
      .trim()
      .replace(/^@+/, ''),
    email: String(a.email || '').trim(),
    avatar:
      typeof a.avatar === 'string' &&
      (a.avatar.startsWith('http://') || a.avatar.startsWith('https://'))
        ? a.avatar
        : null,
  };
};

const readState = () => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.accounts)) {
      return emptyState();
    }
    const accounts = parsed.accounts.map(sanitizeAccount).filter(Boolean);
    return {
      accounts,
      activeId: parsed.activeId ? String(parsed.activeId) : null,
    };
  } catch {
    return emptyState();
  }
};

const writeState = (state) => {
  try {
    localStorage.setItem(
      ACCOUNTS_STORAGE_KEY,
      JSON.stringify({
        accounts: (state.accounts || []).map(sanitizeAccount).filter(Boolean),
        activeId: state.activeId || null,
      })
    );
  } catch {
    /* private mode */
  }
};

const toAccount = (user) =>
  sanitizeAccount({
    id: user.id || user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  });

/** @returns {{ accounts: Array, activeId: string|null }} */
export const listAccountsState = () => readState();

export const listAccounts = () => readState().accounts;

export const getActiveAccountId = () => readState().activeId;

/**
 * Login/register/me dan keyin hisobni ro‘yxatga qo‘shish yoki yangilash.
 * Token saqlanmaydi — server httpOnly device cookie orqali bog‘laydi.
 */
export const upsertAccountFromSession = (user) => {
  if (!user) return readState();
  const next = toAccount(user);
  if (!next?.id) return readState();

  const state = readState();
  const idx = state.accounts.findIndex((a) => a.id === next.id);
  if (idx >= 0) {
    state.accounts[idx] = { ...state.accounts[idx], ...next };
  } else {
    state.accounts.push(next);
  }
  state.activeId = next.id;
  writeState(state);
  return state;
};

/** Profil tahriri / avatar yangilanishini ro‘yxatga sync */
export const patchActiveAccountProfile = (partial = {}) => {
  const state = readState();
  if (!state.activeId) return state;
  const idx = state.accounts.findIndex((a) => a.id === state.activeId);
  if (idx < 0) return state;

  const prev = state.accounts[idx];
  state.accounts[idx] = sanitizeAccount({
    ...prev,
    name: partial.name !== undefined ? partial.name : prev.name,
    username: partial.username !== undefined ? partial.username : prev.username,
    avatar: partial.avatar !== undefined ? partial.avatar : prev.avatar,
    email: partial.email !== undefined ? partial.email : prev.email,
  });
  writeState(state);
  return state;
};

export const setActiveAccountId = (id) => {
  const state = readState();
  state.activeId = id ? String(id) : null;
  writeState(state);
  return state;
};

export const getAccountById = (id) =>
  readState().accounts.find((a) => a.id === String(id)) || null;

/** Serverdan kelgan ro‘yxatni cache qilish (offline/tez ochilish) */
export const replaceAccountsCache = (accounts, activeId = null) => {
  const state = readState();
  const nextAccounts = (accounts || []).map(sanitizeAccount).filter(Boolean);
  const nextActive =
    activeId && nextAccounts.some((a) => a.id === String(activeId))
      ? String(activeId)
      : state.activeId && nextAccounts.some((a) => a.id === state.activeId)
        ? state.activeId
        : nextAccounts[0]?.id || null;
  writeState({ accounts: nextAccounts, activeId: nextActive });
  return { accounts: nextAccounts, activeId: nextActive };
};

/** Switch muvaffaqiyatsiz — cache dan olib tashlash */
export const removeAccount = (id) => {
  const state = readState();
  state.accounts = state.accounts.filter((a) => a.id !== String(id));
  if (state.activeId === String(id)) {
    state.activeId = state.accounts[0]?.id || null;
  }
  writeState(state);
  return state;
};
