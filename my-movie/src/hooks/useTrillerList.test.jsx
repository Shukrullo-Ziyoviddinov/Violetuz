import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTrillerList } from './useTrillerList';
import { fetchAllTrillers } from '../api/trillersApi';
import { GUEST_MOVIE_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';
let mockAuth;
const clients = [];
jest.mock('../store/hooks', () => ({ useAppSelector: (selector) => selector(mockAuth) }));
jest.mock('../store/slices/userSlice', () => ({ selectAuthReady: (state) => state.ready,
  selectIsLoggedIn: (state) => state.logged, selectProfile: (state) => ({ id: state.id }) }));
jest.mock('../api/trillersApi', () => ({ fetchAllTrillers: jest.fn() }));
const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 300000 } } });
  clients.push(client);
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
};
beforeEach(() => { jest.clearAllMocks(); mockAuth = { ready: true, logged: false }; });
afterEach(() => { clients.splice(0).forEach((client) => client.clear()); });

test('Home and the recommendations page share the same cached full ranking without another fetch', async () => {
  const items = [{ id: 8 }, { id: 3 }, { id: 99 }];
  fetchAllTrillers.mockResolvedValue(items);
  const { wrapper } = setup();
  const home = renderHook(() => useTrillerList(), { wrapper });
  await waitFor(() => expect(home.result.current.data).toEqual(items));
  home.unmount();
  const page = renderHook(() => useTrillerList(), { wrapper });
  expect(page.result.current.data).toEqual(items);
  expect(fetchAllTrillers).toHaveBeenCalledTimes(1);
  expect(fetchAllTrillers.mock.calls[0][0].isLoggedIn).toBe(false);
});

test('account switch changes the cache key, cancels the old request and cannot display another viewer list', async () => {
  mockAuth = { ready: true, logged: true, id: 'a' };
  fetchAllTrillers.mockImplementationOnce(() => new Promise(() => {}));
  const { wrapper } = setup();
  const { result, rerender } = renderHook(() => useTrillerList(), { wrapper });
  await waitFor(() => expect(fetchAllTrillers).toHaveBeenCalledTimes(1));
  const signal = fetchAllTrillers.mock.calls[0][0].signal;
  mockAuth = { ready: true, logged: true, id: 'b' };
  fetchAllTrillers.mockResolvedValueOnce([{ id: 'b-only' }]);
  rerender();
  expect(signal.aborted).toBe(true);
  await waitFor(() => expect(result.current.data).toEqual([{ id: 'b-only' }]));
  expect(fetchAllTrillers.mock.calls[1][0].isLoggedIn).toBe(true);
});

test('guest history updates refresh the shared ranking and unresolved auth hides cached guest data', async () => {
  fetchAllTrillers.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([{ id: 2 }]);
  const { wrapper } = setup();
  const { result, rerender } = renderHook(() => useTrillerList(), { wrapper });
  await waitFor(() => expect(result.current.data).toEqual([{ id: 1 }]));
  act(() => window.dispatchEvent(new Event(GUEST_MOVIE_HISTORY_CHANGED)));
  await waitFor(() => expect(result.current.data).toEqual([{ id: 2 }]));
  mockAuth = { ready: false, logged: false };
  rerender();
  expect(result.current.data).toBeUndefined();
  expect(result.current.isPending).toBe(true);
});
