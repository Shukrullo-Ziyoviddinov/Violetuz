import { personBuffer } from './background';

const mask = (bytes) => ({
  width: bytes.length,
  height: 1,
  getAsUint8Array: () => new Uint8Array(bytes),
});

test('keeps the frame unchanged when no person is marked', () => {
  expect(personBuffer(mask([0, 0, 0]))).toBeNull();
  expect(personBuffer(null)).toBeNull();
});

test('marks only the person class', () => {
  const packed = personBuffer(mask([0, 1, 2]));
  expect(Array.from(packed.data)).toEqual([0, 255, 0]);
});
