export const MINI_VIDEO_KIND = {
  KLIP: 'klip',
  KONSERT: 'konsert',
  KINO: 'kino',
  TREYLER: 'treyler',
};

const KINDS = new Set(Object.values(MINI_VIDEO_KIND));

const text = (value) => (value == null ? '' : String(value));

const routePath = (route) => {
  const raw = text(route).trim();
  if (!raw) return '';
  try {
    return new URL(raw, 'http://local').pathname;
  } catch {
    return raw.split('?')[0];
  }
};

export const normalizeMiniVideoSession = (input) => {
  if (!input || input.id == null || !input.src) return null;
  if (!KINDS.has(input.kind)) return null;
  const route = text(input.route).trim();
  if (!route) return null;
  return {
    kind: input.kind,
    id: input.id,
    src: input.src,
    title: text(input.title),
    route,
    subtitle: text(input.subtitle || input.artistName),
    cover: text(input.cover),
  };
};

export const isSameMiniVideoPlayback = (prev, next) => (
  Boolean(prev && next)
  && prev.kind === next.kind
  && String(prev.id) === String(next.id)
  && prev.src === next.src
);

export const mergeMiniVideoSession = (prev, input) => {
  const next = normalizeMiniVideoSession(input);
  if (!next) return prev ?? null;
  if (!prev) return next;
  if (
    isSameMiniVideoPlayback(prev, next)
    && prev.title === next.title
    && prev.route === next.route
    && prev.subtitle === next.subtitle
    && prev.cover === next.cover
  ) {
    return prev;
  }
  if (isSameMiniVideoPlayback(prev, next)) {
    return { ...prev, ...next, src: prev.src };
  }
  return next;
};

export const sessionMatchesDetailPath = (session, pathname) => {
  if (!session || !pathname) return false;
  const path = routePath(session.route);
  if (session.kind === MINI_VIDEO_KIND.KINO) {
    return pathname === path && pathname === `/movie/${session.id}`;
  }
  if (session.kind === MINI_VIDEO_KIND.TREYLER) {
    return pathname === path && /^\/movie\/[^/]+\/trailer$/.test(pathname);
  }
  if (session.kind === MINI_VIDEO_KIND.KLIP || session.kind === MINI_VIDEO_KIND.KONSERT) {
    return pathname === path && pathname === `/music/video/${session.id}`;
  }
  return false;
};
