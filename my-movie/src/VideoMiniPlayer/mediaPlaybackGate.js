const musicPausers = new Set();
const videoPausers = new Set();
const moviePausers = new Set();

export const registerMusicPause = (pause) => {
  musicPausers.add(pause);
  return () => musicPausers.delete(pause);
};

export const registerVideoPause = (pause) => {
  videoPausers.add(pause);
  return () => videoPausers.delete(pause);
};

export const registerMoviePause = (pause) => {
  moviePausers.add(pause);
  return () => moviePausers.delete(pause);
};

export const requestPauseMusic = () => {
  musicPausers.forEach((pause) => pause());
};

export const requestPauseVideo = () => {
  videoPausers.forEach((pause) => pause());
};

export const requestPauseMovie = () => {
  moviePausers.forEach((pause) => pause());
};
