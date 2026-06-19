import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  toggleRepost as toggleRepostAction,
  selectRepostItems,
  selectIsReposted,
} from '../store/slices/repostsSlice';

export const useRepostItems = () => useAppSelector(selectRepostItems);

export const useIsReposted = (id, type) =>
  useAppSelector((state) => selectIsReposted(state, id, type));

export const useReposts = () => {
  const dispatch = useAppDispatch();
  const repostItems = useRepostItems();

  const toggleRepost = useCallback(
    (item) => dispatch(toggleRepostAction(item)),
    [dispatch]
  );

  return {
    repostItems,
    toggleRepost,
  };
};
