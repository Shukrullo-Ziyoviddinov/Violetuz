import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setLoggedIn as setLoggedInAction,
  updateProfile as updateProfileAction,
  setProfile as setProfileAction,
  selectIsLoggedIn,
  selectProfile,
  selectFeedProfileHeader,
} from '../store/slices/userSlice';

/** @deprecated Redux Provider yetarli — eski importlar buzilmasligi uchun qoldirilgan */
export const AuthProvider = ({ children }) => children;

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
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

  return {
    isLoggedIn,
    setLoggedIn,
    profile,
    updateProfile,
    setProfile,
  };
};

/** Feed header uchun: name + avatar */
export const useFeedProfile = () => useAppSelector(selectFeedProfileHeader);
