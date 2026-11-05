import { renderHook } from '@testing-library/react';
import { useTrailerWatch } from './useTrailerWatch';
import { bindTrailerWatch } from './bindTrailerWatch';
import { saveTrailerProgress } from '../progress/trailerProgressApi';
import { queueAccountProgress } from '../progress/accountProgressSync';
let mockState;
const mockStore = { getState: () => mockState };
jest.mock('react-redux', () => ({ useStore: () => mockStore }));
jest.mock('../../store/hooks', () => ({ useAppSelector: (selector) => selector(mockState) }));
jest.mock('../../store/slices/userSlice', () => ({
  selectAuthReady: (state) => state.ready, selectIsLoggedIn: (state) => state.logged,
  selectProfile: (state) => ({ id: state.id }),
}));
jest.mock('./bindTrailerWatch', () => ({ bindTrailerWatch: jest.fn(() => jest.fn()) }));
jest.mock('../progress/trailerProgressApi', () => ({ saveTrailerProgress: jest.fn() }));
jest.mock('../progress/accountProgressSync', () => ({ attachAccountProgressSync: jest.fn(() => jest.fn()), queueAccountProgress: jest.fn() }));
jest.mock('../progress/guestTrendApi', () => ({ createGuestTrendReporter: jest.fn(() => ({ start: jest.fn(), save: jest.fn(), observe: jest.fn() })) }));
beforeEach(() => { jest.clearAllMocks(); mockState = { ready: false, logged: false }; });

test('waits for resolved auth and preserves the original owner on final queued reports after account changes', () => {
  const video = document.createElement('video');
  const { rerender } = renderHook(() => useTrailerWatch(video, 1, 2, '/trailer.mp4'));
  expect(bindTrailerWatch).not.toHaveBeenCalled();
  mockState = { ready: true, logged: true, id: 'account-a' };
  rerender();
  const options = bindTrailerWatch.mock.calls[0][1];
  options.save({ sessionId: 'original' });
  expect(queueAccountProgress).toHaveBeenCalledWith('account-a', { sessionId: 'original' });
  mockState = { ready: true, logged: true, id: 'account-b' };
  options.save({ sessionId: 'stale' });
  expect(queueAccountProgress).toHaveBeenLastCalledWith('account-a', { sessionId: 'stale' });
  expect(saveTrailerProgress).not.toHaveBeenCalled();
  rerender();
  expect(bindTrailerWatch).toHaveBeenCalledTimes(2);
});

test('local guest playback uses guest persistence and rejects another shared trailer source', () => {
  mockState = { ready: true, logged: false };
  const video = document.createElement('video');
  video.src = '/trailer.mp4';
  renderHook(() => useTrailerWatch(video, 1, 2, '/trailer.mp4'));
  const options = bindTrailerWatch.mock.calls[0][1];
  expect(options.ownsMedia()).toBe(true);
  video.dataset.miniVideoId = '99-2';
  expect(options.ownsMedia()).toBe(false);
  options.save({ sessionId: 'guest' });
  expect(saveTrailerProgress.mock.calls[0][0].isLoggedIn).toBe(false);
});
