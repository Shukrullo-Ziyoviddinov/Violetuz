const fs = require('fs');
const { CLIP_SECTIONS_JSON } = require('../config/paths');
const { sendSuccess } = require('../utils/response');

const getClipSections = (_req, res) => {
  const raw = fs.readFileSync(CLIP_SECTIONS_JSON, 'utf8');
  const sections = JSON.parse(raw);
  sendSuccess(res, {
    count: Array.isArray(sections) ? sections.length : 0,
    data: sections,
  });
};

module.exports = {
  getClipSections,
};
