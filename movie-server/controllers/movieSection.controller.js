const fs = require('fs');
const { MOVIE_SECTIONS_JSON, HOME_CONTENT_JSON } = require('../config/paths');
const { sendSuccess } = require('../utils/response');

const getMovieSections = (_req, res) => {
  const raw = fs.readFileSync(MOVIE_SECTIONS_JSON, 'utf8');
  const sections = JSON.parse(raw);
  sendSuccess(res, {
    count: Array.isArray(sections) ? sections.length : 0,
    data: sections,
  });
};

const getHomeContent = (_req, res) => {
  const raw = fs.readFileSync(HOME_CONTENT_JSON, 'utf8');
  const content = JSON.parse(raw);
  sendSuccess(res, {
    count: Array.isArray(content) ? content.length : 0,
    data: content,
  });
};

module.exports = {
  getMovieSections,
  getHomeContent,
};
