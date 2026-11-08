import React, { useRef } from 'react';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { measureVisibleCount, measureVisibleScreen, visibleSlotCount } from './visibleCount';
import { useVisibleCount } from './useVisibleCount';
import { usePagedList } from './usePagedList';
import { isCarouselNearEnd, useLoadMoreTrigger } from './useLoadMoreTrigger';

const clients = [];

const wrapperFor = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
};

beforeEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

test('visible count comes from container, card and gap', () => {
  expect(visibleSlotCount(700, 90, 10)).toBe(7);
  expect(visibleSlotCount(180, 80, 10)).toBe(2);
  expect(visibleSlotCount(100, 90, 10)).toBe(1);
  expect(visibleSlotCount(0, 80, 10)).toBe(0);

  const container = { clientWidth: 250 };
  const item = {
    parentElement: {},
    getBoundingClientRect: () => ({ width: 100 }),
  };
  const original = global.getComputedStyle;
  global.getComputedStyle = () => ({ columnGap: '20px', gap: '20px' });
  expect(measureVisibleCount(container, item)).toBe(3);
  const screenItem = {
    parentElement: {},
    getBoundingClientRect: () => ({ width: 100, height: 180 }),
  };
  global.getComputedStyle = () => ({ columnGap: '20px', rowGap: '10px', gap: '20px' });
  expect(measureVisibleScreen({ clientWidth: 240 }, screenItem, 400)).toBe(6);
  global.getComputedStyle = original;
});

test('visible count hook follows the measured nodes', () => {
  const observed = [];
  global.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe(node) {
      observed.push(node);
    }
    disconnect() {}
  };
  const originalStyle = global.getComputedStyle;
  global.getComputedStyle = () => ({ columnGap: '0px', gap: '0px' });

  function Probe() {
    const containerRef = useRef(null);
    const itemRef = useRef(null);
    const count = useVisibleCount(containerRef, itemRef);
    return (
      <div
        ref={(node) => {
          if (node) Object.defineProperty(node, 'clientWidth', { value: 200 });
          containerRef.current = node;
        }}
      >
        <div
          ref={(node) => {
            if (node) node.getBoundingClientRect = () => ({ width: 80 });
            itemRef.current = node;
          }}
          data-count={count}
        />
      </div>
    );
  }

  const view = render(<Probe />);
  expect(view.container.querySelector('[data-count="3"]')).toBeTruthy();
  expect(observed.length).toBeGreaterThan(0);
  global.getComputedStyle = originalStyle;
});

test('paged cache asks for the limit set before the next page and shares the key', async () => {
  const calls = [];
  const fetchPage = jest.fn(async ({ offset, limit }) => {
    calls.push({ offset, limit });
    if (offset === 0) {
      return { items: [{ id: 'a' }, { id: 'b' }], hasMore: true, nextOffset: 2 };
    }
    return {
      items: [{ id: 'c' }, { id: 'd' }, { id: 'e' }],
      hasMore: false,
      nextOffset: 5,
    };
  });
  const { wrapper } = wrapperFor();
  const first = renderHook(
    () => usePagedList({
      queryKey: ['shared-page'],
      fetchPage,
      getLimit: () => 2,
    }),
    { wrapper }
  );

  await waitFor(() => expect(first.result.current.items.map((item) => item.id)).toEqual(['a', 'b']));
  await act(async () => {
    await first.result.current.fetchNextPage(3);
  });
  expect(calls).toEqual([
    { offset: 0, limit: 2 },
    { offset: 2, limit: 3 },
  ]);
  expect(first.result.current.hasMore).toBe(false);

  first.unmount();
  const second = renderHook(
    () => usePagedList({
      queryKey: ['shared-page'],
      fetchPage,
      getLimit: () => 2,
    }),
    { wrapper }
  );
  await waitFor(() => expect(second.result.current.items).toHaveLength(5));
  expect(fetchPage).toHaveBeenCalledTimes(2);
});

test('load more uses one call for the vertical sentinel and the carousel signal', () => {
  let observer;
  global.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
      observer = this;
    }
    observe() {}
    disconnect() {}
  };
  const onLoadMore = jest.fn();
  const { result } = renderHook(() => useLoadMoreTrigger({ enabled: true, onLoadMore }));
  const node = document.createElement('div');
  act(() => {
    result.current.sentinelRef(node);
  });
  act(() => {
    observer.callback([{ isIntersecting: true }]);
  });
  act(() => {
    result.current.notifyNearEnd();
  });
  expect(onLoadMore).toHaveBeenCalledTimes(2);

  const paused = renderHook(() => useLoadMoreTrigger({ enabled: false, onLoadMore }));
  act(() => {
    paused.result.current.notifyNearEnd();
  });
  expect(onLoadMore).toHaveBeenCalledTimes(2);
  expect(isCarouselNearEnd(9, 100)).toBe(true);
  expect(isCarouselNearEnd(100, 100)).toBe(false);
});
