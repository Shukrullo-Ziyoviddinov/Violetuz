const musicPausers = new Set();
const videoEngines = new Set();
let activeVideo = null;

export const registerMusicPause = (pause) => {
  musicPausers.add(pause);
  return () => musicPausers.delete(pause);
};

export const registerVideoEngine = (engine) => {
  videoEngines.add(engine);
  return () => {
    videoEngines.delete(engine);
    if (activeVideo === engine) activeVideo = null;
  };
};

export const claimVideoPlayback = (engine) => {
  if (!engine) return;
  activeVideo = engine;
  engine.release?.();
  videoEngines.forEach((other) => {
    if (other !== engine) other.yield();
  });
  musicPausers.forEach((pause) => pause());
};

export const requestPauseVideos = () => {
  videoEngines.forEach((engine) => engine.pause());
};

export const requestPauseMusic = () => {
  musicPausers.forEach((pause) => pause());
};

export const requestPauseVideo = requestPauseVideos;
export const requestPauseMovie = requestPauseVideos;

export const registerVideoPause = (pause) => registerVideoEngine({
  pause,
  yield: pause,
});

export const registerMoviePause = (pause) => registerVideoEngine({
  pause,
  yield: pause,
});
