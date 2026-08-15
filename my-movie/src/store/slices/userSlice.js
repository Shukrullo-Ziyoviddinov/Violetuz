import { createSlice, createSelector } from '@reduxjs/toolkit';
import {
  DEFAULT_PROFILE,
  parseStoredProfile,
  loadLegacyUserState,
  writeProfileCache,
  clearAuthStorage,
} from './userUtils';

const initialState = loadLegacyUserState();

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoggedIn: (state, action) => {
      state.isLoggedIn = !!action.payload;
      if (!action.payload) {
        clearAuthStorage();
      }
    },
    setAuthReady: (state, action) => {
      state.authReady = action.payload !== false;
    },
    setAuthSession: (state, action) => {
      const payload = action.payload || {};
      const nested = payload.data && typeof payload.data === 'object' ? payload.data : null;
      const user = payload.user || nested?.user || null;
      state.isLoggedIn = Boolean(user);
      state.authReady = true;
      if (user) {
        state.profile = parseStoredProfile({
          id: user.id || user._id,
          name: user.name,
          username: user.username,
          bio: user.bio !== undefined ? user.bio : state.profile.bio,
          avatar: user.avatar !== undefined ? user.avatar || null : state.profile.avatar,
          email: user.email,
          role: user.role,
        });
        writeProfileCache(state.profile);
      }
    },
    clearAuthSession: (state) => {
      state.isLoggedIn = false;
      state.authReady = true;
      state.profile = { ...DEFAULT_PROFILE };
      clearAuthStorage();
    },
    setProfile: (state, action) => {
      state.profile = parseStoredProfile({
        ...state.profile,
        ...action.payload,
        id: action.payload?.id ?? state.profile.id,
      });
      state.isLoggedIn = true;
      writeProfileCache(state.profile);
    },
    updateProfile: (state, action) => {
      const data = action.payload || {};
      state.profile = parseStoredProfile({
        id: data.id !== undefined ? data.id : state.profile.id,
        name: data.name !== undefined ? data.name : state.profile.name,
        username: data.username !== undefined ? data.username : state.profile.username,
        bio: data.bio !== undefined ? data.bio : state.profile.bio,
        avatar: data.avatar !== undefined ? data.avatar : state.profile.avatar,
        email: data.email !== undefined ? data.email : state.profile.email,
        role: data.role !== undefined ? data.role : state.profile.role,
      });
      state.isLoggedIn = true;
      writeProfileCache(state.profile);
    },
  },
});

export const {
  setLoggedIn,
  setAuthReady,
  setAuthSession,
  clearAuthSession,
  setProfile,
  updateProfile,
} = userSlice.actions;

export const selectIsLoggedIn = (state) => state.user.isLoggedIn;
export const selectAuthReady = (state) => state.user.authReady;
export const selectProfile = (state) => state.user.profile;

export const selectFeedProfileHeader = createSelector([selectProfile], (profile) => ({
  name: profile.name?.trim() || DEFAULT_PROFILE.name,
  avatar: profile.avatar ?? null,
}));

export default userSlice.reducer;
