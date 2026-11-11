import { useCallback, useRef } from 'react';
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
import { selectIsLoggedIn, selectProfile } from '../store/slices/userSlice';
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
  const profileId = useAppSelector((state) => selectProfile(state)?.id);
  const jobsRef = useRef(new Map());

  const isSelfUser = (id, type) =>
    type === 'user' && profileId != null && String(id) === String(profileId);

  const syncFollow = useCallback(
    (id, type, want) => {
      if (!requireAuthOrOpenRegister(isLoggedIn)) return;
      if (!type || isSelfUser(id, type)) return;

      const key = `${type}:${String(id)}`;
      const payload = { id, type };
      let job = jobsRef.current.get(key);
      if (!job) {
        job = { desired: want, applied: !want, running: false };
        jobsRef.current.set(key, job);
      } else {
        job.desired = want;
      }
      dispatch(want ? followAction(payload) : unfollowAction(payload));

      const pump = async () => {
        if (job.running) return;
        job.running = true;
        try {
          while (job.desired !== job.applied) {
            const next = job.desired;
            try {
              if (next) await addFollowRequest(payload);
              else await removeFollowRequest(payload);
              job.applied = next;
            } catch (err) {
              if (!next && err?.status === 404) {
                job.applied = false;
                continue;
              }
              if (job.desired !== next) continue;
              job.desired = !next;
              job.applied = !next;
              dispatch(next ? unfollowAction(payload) : followAction(payload));
            }
          }
        } finally {
          job.running = false;
        }
        if (job.desired !== job.applied) pump();
      };

      pump();
    },
    [dispatch, isLoggedIn, profileId]
  );

  const follow = useCallback((id, type = null) => syncFollow(id, type, true), [syncFollow]);

  const unfollow = useCallback((id, type = null) => syncFollow(id, type, false), [syncFollow]);

  const toggleFollowing = useCallback(
    async (id, type = null) => {
      if (!requireAuthOrOpenRegister(isLoggedIn)) return;
      if (!type || (type === 'user' && profileId != null && String(id) === String(profileId))) return;
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
    [dispatch, isLoggedIn, followingItems, profileId]
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
