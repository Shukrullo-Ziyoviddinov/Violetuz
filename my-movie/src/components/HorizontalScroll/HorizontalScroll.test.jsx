import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import HorizontalScroll from './HorizontalScroll';

let resizeCallback;

beforeAll(() => {
  global.ResizeObserver = class {
    constructor(callback) {
      resizeCallback = callback;
    }
    observe() {}
    disconnect() {}
  };
});

afterEach(() => {
  resizeCallback = undefined;
});

const layout = (view) => {
  const viewport = view.container.querySelector('.horizontal-scroll-viewport');
  const track = view.container.querySelector('.horizontal-scroll-track');
  const card = track.firstElementChild;
  Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 200 });
  Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 800 });
  Object.defineProperty(card, 'offsetWidth', { configurable: true, value: 100 });
  act(() => {
    resizeCallback();
  });
  return { viewport, track };
};

test('signals once when less than one card remains, without changing the drag math', () => {
  jest.useFakeTimers();
  const onNearEnd = jest.fn();
  const scrollToIndexRef = React.createRef();
  const view = render(
    <HorizontalScroll onNearEnd={onNearEnd} scrollToIndexRef={scrollToIndexRef}>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="card">{index}</div>
      ))}
    </HorizontalScroll>
  );
  const { track } = layout(view);
  expect(onNearEnd).not.toHaveBeenCalled();

  const clickRight = () => {
    fireEvent.click(view.getByRole('button', { name: 'Scroll right' }));
    act(() => {
      jest.runOnlyPendingTimers();
    });
  };

  clickRight();
  clickRight();
  expect(onNearEnd).not.toHaveBeenCalled();
  const before = track.style.transform;

  clickRight();
  clickRight();
  clickRight();
  expect(onNearEnd).toHaveBeenCalledTimes(1);
  expect(track.style.transform).not.toBe(before);
  expect(track.style.transform).toContain('translate3d(');

  act(() => {
    scrollToIndexRef.current(0);
    jest.runOnlyPendingTimers();
  });
  clickRight();
  clickRight();
  clickRight();
  clickRight();
  clickRight();
  expect(onNearEnd).toHaveBeenCalledTimes(2);
  jest.useRealTimers();
});

test('a fling aimed past the old end continues when the next cards arrive', () => {
  const view = render(
    <HorizontalScroll>
      {Array.from({ length: 3 }, (_, index) => <div key={index} className="card">{index}</div>)}
    </HorizontalScroll>
  );
  const viewport = view.container.querySelector('.horizontal-scroll-viewport');
  const track = view.container.querySelector('.horizontal-scroll-track');
  const size = (scrollWidth) => {
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 220 });
    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: scrollWidth });
    Object.defineProperty(track.firstElementChild, 'offsetWidth', { configurable: true, value: 100 });
    act(() => resizeCallback());
  };
  size(300);
  const queue = [];
  let now = 1000;
  const nowSpy = jest.spyOn(performance, 'now').mockImplementation(() => now);
  const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    queue.push(callback);
    return queue.length;
  });
  const runFrames = () => {
    act(() => {
      let guard = 0;
      while (queue.length && guard < 40) {
        const callback = queue.shift();
        now += 16;
        callback(now);
        guard += 1;
      }
    });
  };

  fireEvent.mouseDown(viewport, { button: 0, clientX: 400, clientY: 20 });
  now += 16;
  fireEvent.mouseMove(window, { clientX: 250, clientY: 20 });
  now += 16;
  fireEvent.mouseMove(window, { clientX: 40, clientY: 20 });
  fireEvent.mouseUp(window);
  runFrames();
  const stoppedAt = track.style.transform;

  view.rerender(
    <HorizontalScroll>
      {Array.from({ length: 8 }, (_, index) => <div key={index} className="card">{index}</div>)}
    </HorizontalScroll>
  );
  size(900);

  const readX = (value) => Number(String(value).match(/translate3d\(([-\d.]+)px/)?.[1] || 0);
  expect(readX(track.style.transform)).toBeLessThan(readX(stoppedAt));
  nowSpy.mockRestore();
  rafSpy.mockRestore();
});
