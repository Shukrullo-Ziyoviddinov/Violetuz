import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  follow as followAction,
  unfollow as unfollowAction,
  toggleFollowing as toggleFollowingAction,
  setFollowingItems,
  selectFollowingIds,
  selectFollowingItems,
  selectIsFollowing,
} from '../store/slices/followingSlice';
import { selectIsLoggedIn } from '../store/slices/userSlice';
import { sameFollowId } from '../store/slices/followingUtils';
import {
  addFollowRequest,
  removeFollowRequest,
  toggleFollowRequest,
} from '../api/followingApi';
import { requestOpenAuthModal } from '../authModalBridge';

export const useFollowingIds = () => useAppSelector(selectFollowingIds);
export const useFollowingItems = () => useAppSelector(selectFollowingItems);

export const useIsFollowing = (id, type = null) =>
  useAppSelector((state) => selectIsFollowing(state, id, type));

const requireAuthOrOpenRegister = (isLoggedIn) => {
  if (isLoggedIn) return true;
  requestOpenAuthModal('register');
  return false;
};

export const useFollowing = () => {
  const dispatch = useAppDispatch();
  const followingIds = useFollowingIds();
  const followingItems = useFollowingItems();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  const follow = useCallback(
    async (id, type = null) => {
      if (!requireAuthOrOpenRegister(isLoggedIn)) return;
      if (!type) return;
      const payload = { id, type };
      dispatch(followAction(payload));
      try {
        const data = await addFollowRequest(payload);
        if (data?.item) dispatch(followAction(data.item));
      } catch {
        dispatch(unfollowAction(payload));
      }
    },
    [dispatch, isLoggedIn]
  );

  const unfollow = useCallback(
    async (id, type = null) => {
      if (!requireAuthOrOpenRegister(isLoggedIn)) return;
      if (!type) return;
      const payload = { id, type };
      dispatch(unfollowAction(payload));
      try {
        await removeFollowRequest(payload);
      } catch {
        dispatch(followAction(payload));
      }
    },
    [dispatch, isLoggedIn]
  );

  const toggleFollowing = useCallback(
    async (id, type = null) => {
      if (!requireAuthOrOpenRegister(isLoggedIn)) return;
      if (!type) return;
      const payload = { id, type };
      const had = followingItems.some(
        (x) => sameFollowId(x.id, id) && (x.type == null || x.type === type)
      );
      dispatch(toggleFollowingAction(payload));
      try {
        const data = await toggleFollowRequest(payload);
        if (Array.isArray(data?.items)) {
          dispatch(setFollowingItems(data.items));
        }
      } catch {
        if (had) dispatch(followAction(payload));
        else dispatch(unfollowAction(payload));
      }
    },
    [dispatch, isLoggedIn, followingItems]
  );

  const isFollowing = useCallback(
    (id, type = null) =>
      followingItems.some(
        (x) =>
          sameFollowId(x.id, id) &&
          (type == null || x.type == null || x.type === type)
      ),
    [followingItems]
  );

  return {
    followingIds,
    followingItems,
    follow,
    unfollow,
    toggleFollowing,
    isFollowing,
  };
};
