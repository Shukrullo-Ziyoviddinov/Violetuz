import { useAppSelector } from '../store/hooks';
import {
  selectLikeHistoryItems,
  selectReaction,
  selectShortsLikeCount,
} from '../store/slices/likesSlice';

export const useLikeHistory = () => useAppSelector(selectLikeHistoryItems);

export const useReaction = (key) => useAppSelector((state) => selectReaction(state, key));

export const useShortsLikeCount = (shortsId) =>
  useAppSelector((state) => selectShortsLikeCount(state, shortsId));
