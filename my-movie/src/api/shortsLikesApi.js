/**
 * @deprecated Redux `likesSlice` dan foydalaning. Orqaga moslik uchun qoldirilgan.
 */
import { store } from '../store/store';
import {
  toggleShortsLike as toggleShortsLikeAction,
  selectShortsLikeCount,
} from '../store/slices/likesSlice';

/** User usha shortni like qilganmi - 1 yoki 0 */
export const getLikeCount = (shortsId) => selectShortsLikeCount(store.getState(), shortsId);

/** Toggle: like qilgan bo'lsa olib tashlash, qilmagan bo'lsa qo'shish */
export const toggleShortsLike = (shortsId) => {
  if (shortsId == null || shortsId === '') return 0;
  store.dispatch(toggleShortsLikeAction(shortsId));
  return getLikeCount(shortsId);
};

export const getLikedShortsIds = () => new Set(store.getState().likes.shortsLikedIds);
