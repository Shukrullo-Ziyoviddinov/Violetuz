export const isMovieLike = (item) =>
  !!item &&
  typeof item === 'object' &&
  typeof item.id === 'number' &&
  typeof item.categoryName === 'string';

export const normalizeMoviesPayload = (payload) => {
  const list = Array.isArray(payload?.data) ? payload.data : [];
  return list.filter(isMovieLike);
};

export const isMovieSectionLike = (item) =>
  !!item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  typeof item.categoryName === 'string' &&
  typeof item.titleKey === 'string';

export const normalizeMovieSectionsPayload = (payload) => {
  const list = Array.isArray(payload?.data) ? payload.data : [];
  return list.filter(isMovieSectionLike);
};

export const isHomeBlockLike = (item) =>
  !!item &&
  typeof item === 'object' &&
  typeof item.type === 'string';

export const normalizeHomeContentPayload = (payload) => {
  const list = Array.isArray(payload?.data) ? payload.data : [];
  return list.filter(isHomeBlockLike);
};
