import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  toggleRepost as toggleRepostAction,
  addRepost as addRepostAction,
  removeRepost as removeRepostAction,
  selectRepostItems,
  selectIsReposted,
} from '../store/slices/repostsSlice';
import { isRepostedInList } from '../store/slices/repostsUtils';
import { sanitizeRepostItem } from '../components/Repost/repostTypes';
import { selectIsLoggedIn } from '../store/slices/userSlice';
import { toggleRepostRequest } from '../api/repostsApi';
import { requestOpenAuthModal } from '../authModalBridge';

export const useRepostItems = () => useAppSelector(selectRepostItems);

export const useIsReposted = (id, type) =>
  useAppSelector((state) => selectIsReposted(state, id, type));

const requireAuthOrOpenRegister = (isLoggedIn) => {
  if (isLoggedIn) return true;
  requestOpenAuthModal('register');
  return false;
};

export const useReposts = () => {
  const dispatch = useAppDispatch();
  const repostItems = useRepostItems();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  const toggleRepost = useCallback(
    async (item) => {
      if (!requireAuthOrOpenRegister(isLoggedIn)) return;
      const sanitized = sanitizeRepostItem(item);
      if (!sanitized) return;

      const previous = repostItems.find(
        (x) => isRepostedInList([x], sanitized.id, sanitized.type)
      );
      const had = Boolean(previous);

      dispatch(toggleRepostAction(sanitized));

      try {
        const data = await toggleRepostRequest({
          id: sanitized.id,
          type: sanitized.type,
        });
        if (data?.added && data?.item) {
          dispatch(addRepostAction(data.item));
        }
      } catch {
        if (had) {
          dispatch(addRepostAction(previous));
        } else {
          dispatch(removeRepostAction(sanitized));
        }
      }
    },
    [dispatch, isLoggedIn, repostItems]
  );

  return {
    repostItems,
    toggleRepost,
  };
};
