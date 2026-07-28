import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutRequest } from '../api/authApi';
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
    (data) => dispatch(updateProfileAction(data)),
    [dispatch]
  );

  const setProfile = useCallback(
    (data) => dispatch(setProfileAction(data)),
    [dispatch]
  );

  const setAuthSession = useCallback(
    (payload) => dispatch(setAuthSessionAction(payload)),
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      /* cookie yo‘q bo‘lsa ham UI tozalanadi */
    }
    dispatch(clearAuthSessionAction());
  }, [dispatch]);

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
