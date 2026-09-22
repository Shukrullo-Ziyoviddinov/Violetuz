'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../data/movie.json');
const movies = JSON.parse(fs.readFileSync(file, 'utf8'));

const mapCategory = (m) => {
  const country = String(m.filterCountry || m.country || '')
    .trim()
    .toLowerCase();
  const genres = Array.isArray(m.filterGenre)
    ? m.filterGenre.map((g) => String(g).toLowerCase())
    : [];
  const has = (s) => genres.some((g) => g.includes(s));

  if (
    country.includes('russia') ||
    country.includes('rossiya') ||
    country.includes('росс')
  ) {
    return 'russianMovies';
  }
  if (country.includes('korea') || country.includes('koreya')) {
    return 'koreaDrama';
  }
  if (
    country.includes('uzbek') ||
    country.includes('o‘zbek') ||
    country.includes("o'zbek")
  ) {
    return 'uzbekMovies';
  }
  if (country.includes('turk') || country.includes('turkey')) {
    return 'turkishSeries';
  }
  if (has('romant')) return 'romanceMovies';
  if (has('sarguzasht') || has('adventure')) return 'adventureMovies';
  if (has('jangari') || has('action')) return 'actionMovies';
  if (has("qo'rqinch") || has('qorqinch') || has('horror')) {
    return 'horrorMovies';
  }
  if (has('anime')) return 'anime';
  return 'worldMovies';
};

const counts = {};
let changed = 0;
for (const m of movies) {
  if (m.categoryName !== 'movies') continue;
  const next = mapCategory(m);
  m.categoryName = next;
  counts[next] = (counts[next] || 0) + 1;
  changed += 1;
}

const left = movies.filter((m) => m.categoryName === 'movies').length;
fs.writeFileSync(file, JSON.stringify(movies, null, 2) + '\n', 'utf8');
console.log('changed', changed);
console.log('remaining movies category', left);
console.log('distribution', counts);
