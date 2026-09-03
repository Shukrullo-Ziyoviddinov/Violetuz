import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutRequest, switchAccountRequest } from '../api/authApi';
import {
  setLoggedIn as setLoggedInAction,
  updateProfile as updateProfileAction,
  setProfile as setProfileAction,
  setAuthSession as setAuthSessionAction,
  clearAuthSession as clearAuthSessionAction,
  selectIsLoggedIn,
  selectAuthReady,
  selectProfile,
  selectFeedProfileHeader,
} from '../store/slices/userSlice';
import {
  upsertAccountFromSession,
  patchActiveAccountProfile,
  setActiveAccountId,
  getActiveAccountId,
  removeAccount,
  listAccountsState,
} from '../accounts/accountsStorage';

/** @deprecated Redux Provider yetarli — eski importlar buzilmasligi uchun qoldirilgan */
export const AuthProvider = ({ children }) => children;

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const authReady = useAppSelector(selectAuthReady);
  const profile = useAppSelector(selectProfile);

  const setLoggedIn = useCallback(
    (value) => dispatch(setLoggedInAction(!!value)),
    [dispatch]
  );

  const updateProfile = useCallback(
    (data) => {
      dispatch(updateProfileAction(data));
      patchActiveAccountProfile(data || {});
    },
    [dispatch]
  );

  const setProfile = useCallback(
    (data) => {
      dispatch(setProfileAction(data));
      if (data) {
        patchActiveAccountProfile(data);
      }
    },
    [dispatch]
  );

  const setAuthSession = useCallback(
    (payload) => {
      dispatch(setAuthSessionAction(payload));
      const user = payload?.user;
      if (user) {
        upsertAccountFromSession(user);
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    const currentActiveId = profile?.id || getActiveAccountId();
    try {
      await logoutRequest();
    } catch {
      /* cookie yo‘q bo‘lsa ham UI tozalanadi */
    }

    let state = currentActiveId ? removeAccount(currentActiveId) : listAccountsState();
    let candidates = (state.accounts || []).map((account) => account.id).filter(Boolean);

    while (candidates.length) {
      const nextId = candidates[0];
      try {
        const data = await switchAccountRequest({ userId: nextId });
        const nextUser = data?.user;
        if (nextUser) {
          dispatch(setAuthSessionAction({ user: nextUser }));
          upsertAccountFromSession(nextUser);
          setActiveAccountId(String(nextUser.id || nextUser._id || nextId));
          return;
        }
      } catch {
        /* stale account - remove and try the next one */
      }

      state = removeAccount(nextId);
      candidates = (state.accounts || []).map((account) => account.id).filter(Boolean);
    }

    dispatch(clearAuthSessionAction());
    setActiveAccountId(null);
  }, [dispatch, profile?.id]);

  return {
    isLoggedIn,
    authReady,
    setLoggedIn,
    profile,
    updateProfile,
    setProfile,
    setAuthSession,
    logout,
  };
};

/** Feed header uchun: name + avatar */
export const useFeedProfile = () => useAppSelector(selectFeedProfileHeader);
