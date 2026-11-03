const uploadedAt = (item) => {
  const time = Date.parse(item?.createdAt || item?.uploadedAt || '');
  return Number.isFinite(time) ? time : 0;
};

/** Yangi yuklangan yuqorida. createdAt yo'q bo'lsa oxirda. id ishtirok etmaydi. */
export const sortByUploadedAtDesc = (list) =>
  [...(Array.isArray(list) ? list : [])].sort((a, b) => uploadedAt(b) - uploadedAt(a));
