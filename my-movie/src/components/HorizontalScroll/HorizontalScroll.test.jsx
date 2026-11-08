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
