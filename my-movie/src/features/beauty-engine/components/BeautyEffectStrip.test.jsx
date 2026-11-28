import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { getBeautyPresetStrip } from '../config/beautyConfig';
import BeautyEffectStrip from './BeautyEffectStrip';

const effects = getBeautyPresetStrip('uz');

test('renders a horizontal round chooser from the preset list', () => {
  const onChange = jest.fn();
  const view = render(
    <BeautyEffectStrip effects={effects} value="natural" onChange={onChange} />,
  );
  expect(view.getByRole('radiogroup', { name: 'Effektlar' })).toBeTruthy();
  expect(view.getAllByRole('radio')).toHaveLength(effects.length);
  effects.forEach((effect) => {
    expect(view.getByRole('radio', { name: effect.label })).toBeTruthy();
  });
  const selected = view.getByRole('radio', { name: 'Tabiiy' });
  expect(selected.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(view.getByRole('radio', { name: 'Yumshoq' }));
  expect(onChange).toHaveBeenCalledWith('soft');
});

test('does not move while the record button is held', () => {
  const onChange = jest.fn();
  const view = render(
    <BeautyEffectStrip effects={effects} value="original" onChange={onChange} locked />,
  );
  const strip = view.getByRole('radiogroup');
  let left = 0;
  Object.defineProperty(strip, 'scrollLeft', {
    configurable: true,
    get: () => left,
    set: (value) => {
      left = value;
    },
  });
  left = 48;
  fireEvent.scroll(strip);
  expect(left).toBe(0);
  const wheel = new WheelEvent('wheel', { cancelable: true, bubbles: true });
  strip.dispatchEvent(wheel);
  expect(wheel.defaultPrevented).toBe(true);
  fireEvent.click(view.getByRole('radio', { name: 'Kino' }));
  expect(onChange).toHaveBeenCalledWith('cinematic');
});
