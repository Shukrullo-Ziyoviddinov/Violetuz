const fs = require('fs');
const { MUSIC_SECTIONS_JSON, MUSIC_PAGE_CONTENT_JSON } = require('../config/paths');
const { sendSuccess } = require('../utils/response');

const getMusicSections = (_req, res) => {
  const raw = fs.readFileSync(MUSIC_SECTIONS_JSON, 'utf8');
  const sections = JSON.parse(raw);
  sendSuccess(res, {
    count: Array.isArray(sections) ? sections.length : 0,
    data: sections,
  });
};

const getMusicPageContent = (_req, res) => {
  const raw = fs.readFileSync(MUSIC_PAGE_CONTENT_JSON, 'utf8');
  const content = JSON.parse(raw);
  sendSuccess(res, {
    count: Array.isArray(content) ? content.length : 0,
    data: content,
  });
};

module.exports = {
  getMusicSections,
  getMusicPageContent,
};
