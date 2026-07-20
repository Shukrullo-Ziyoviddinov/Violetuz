import movieJson from './movie.json';

const data = Array.isArray(movieJson) ? movieJson : [];

export const allMovies = data;
export const movies = data.filter((item) => item.categoryName === 'movies');
export const recommendedMovies = [...movies];
