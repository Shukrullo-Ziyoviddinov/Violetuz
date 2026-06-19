import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  follow as followAction,
  unfollow as unfollowAction,
  toggleFollowing as toggleFollowingAction,
  selectFollowingIds,
  selectIsFollowing,
} from '../store/slices/followingSlice';
import { sameFollowId } from '../store/slices/followingUtils';

export const useFollowingIds = () => useAppSelector(selectFollowingIds);

export const useIsFollowing = (id) => useAppSelector((state) => selectIsFollowing(state, id));

export const useFollowing = () => {
  const dispatch = useAppDispatch();
  const followingIds = useFollowingIds();

  const follow = useCallback((id) => dispatch(followAction(id)), [dispatch]);

  const unfollow = useCallback((id) => dispatch(unfollowAction(id)), [dispatch]);

  const toggleFollowing = useCallback(
    (id) => dispatch(toggleFollowingAction(id)),
    [dispatch]
  );

  const isFollowing = useCallback(
    (id) => followingIds.some((x) => sameFollowId(x, id)),
    [followingIds]
  );

  return {
    followingIds,
    follow,
    unfollow,
    toggleFollowing,
    isFollowing,
  };
};
