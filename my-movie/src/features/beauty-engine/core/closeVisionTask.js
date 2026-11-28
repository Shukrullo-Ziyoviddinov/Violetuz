export function closeVisionTask(task) {
  if (!task) return;
  const worker = task.worker || task.wasmWorker || null;
  try {
    task.close?.();
  } catch {
    /* model allaqachon yopilgan */
  }
  try {
    worker?.terminate?.();
  } catch {
    /* worker allaqachon to‘xtagan */
  }
}
