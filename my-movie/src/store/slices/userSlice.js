import { createSlice, createSelector } from '@reduxjs/toolkit';
import {
  DEFAULT_PROFILE,
  normalizeUsername,
  parseStoredProfile,
} from './userUtils';

const initialState = {
  isLoggedIn: false,
  profile: { ...DEFAULT_PROFILE },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoggedIn: (state, action) => {
      state.isLoggedIn = !!action.payload;
    },
    setProfile: (state, action) => {
      state.profile = parseStoredProfile(action.payload);
      state.isLoggedIn = true;
    },
    updateProfile: (state, action) => {
      const data = action.payload || {};
      state.profile = {
        name: data.name?.trim() || state.profile.name,
        username: normalizeUsername(
          data.username !== undefined ? data.username : state.profile.username
        ),
        bio: data.bio !== undefined ? String(data.bio).trim() : state.profile.bio,
        avatar: data.avatar !== undefined ? data.avatar : state.profile.avatar,
      };
      state.isLoggedIn = true;
    },
  },
});

export const { setLoggedIn, setProfile, updateProfile } = userSlice.actions;

export const selectIsLoggedIn = (state) => state.user.isLoggedIn;
export const selectProfile = (state) => state.user.profile;

export const selectFeedProfileHeader = createSelector([selectProfile], (profile) => ({
  name: profile.name?.trim() || DEFAULT_PROFILE.name,
  avatar: profile.avatar ?? null,
}));

export default userSlice.reducer;
