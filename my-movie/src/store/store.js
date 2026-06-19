import { combineReducers, configureStore, isAction } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import wishlistReducer from './slices/wishlistSlice';
import userReducer from './slices/userSlice';
import likesReducer, { setReaction } from './slices/likesSlice';
import followingReducer from './slices/followingSlice';
import repostsReducer from './slices/repostsSlice';
import wishlistLegacyStorage from './wishlistLegacyStorage';
import userLegacyStorage from './userLegacyStorage';
import likesLegacyStorage from './likesLegacyStorage';
import followingLegacyStorage from './followingLegacyStorage';
import repostsLegacyStorage from './repostsLegacyStorage';
import { applyLegacyReaction } from './slices/likesUtils';

const likesLegacySyncMiddleware = () => (next) => (action) => {
  const result = next(action);
  if (isAction(action) && setReaction.match(action)) {
    const { key, value } = action.payload || {};
    if (key) applyLegacyReaction(key, value || 'none');
  }
  return result;
};

const wishlistPersistConfig = {
  key: 'wishlist',
  storage: wishlistLegacyStorage,
};

const userPersistConfig = {
  key: 'user',
  storage: userLegacyStorage,
};

const likesPersistConfig = {
  key: 'likes',
  storage: likesLegacyStorage,
};

const followingPersistConfig = {
  key: 'following',
  storage: followingLegacyStorage,
};

const repostsPersistConfig = {
  key: 'reposts',
  storage: repostsLegacyStorage,
};

const rootReducer = combineReducers({
  wishlist: persistReducer(wishlistPersistConfig, wishlistReducer),
  user: persistReducer(userPersistConfig, userReducer),
  likes: persistReducer(likesPersistConfig, likesReducer),
  following: persistReducer(followingPersistConfig, followingReducer),
  reposts: persistReducer(repostsPersistConfig, repostsReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }).concat(likesLegacySyncMiddleware),
});

export const persistor = persistStore(store);
