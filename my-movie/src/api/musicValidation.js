export const isMusicLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  typeof item.title === 'string' &&
  typeof item.categoryNameMusic === 'string';

export const normalizeMusicPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload.filter(isMusicLike);
  }

  if (Array.isArray(payload?.data)) {
    return payload.data.filter(isMusicLike);
  }

  return [];
};

export const isMusicSectionLike = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  typeof item.categoryNameMusic === 'string';

export const normalizeMusicSectionsPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload.filter(isMusicSectionLike);
  }

  if (Array.isArray(payload?.data)) {
    return payload.data.filter(isMusicSectionLike);
  }

  return [];
};

export const isMusicPageBlockLike = (item) =>
  item && typeof item === 'object' && typeof item.type === 'string';

export const normalizeMusicPageContentPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload.filter(isMusicPageBlockLike);
  }

  if (Array.isArray(payload?.data)) {
    return payload.data.filter(isMusicPageBlockLike);
  }

  return [];
};
