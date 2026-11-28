export function holdBeautyEngine(slot, create) {
  if (!slot.current) slot.current = create();
  return slot.current;
}
