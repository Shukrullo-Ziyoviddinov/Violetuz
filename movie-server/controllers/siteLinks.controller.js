const siteLinksService = require('../services/siteLinks.service');
const { sendSuccess } = require('../utils/response');

const getSiteLinks = async (_req, res) => {
  const item = await siteLinksService.getSiteLinks();
  sendSuccess(res, { data: item });
};

const getContact = async (_req, res) => {
  const contact = await siteLinksService.getContact();
  sendSuccess(res, { data: contact });
};

const getSocialLinks = async (_req, res) => {
  const socialLinks = await siteLinksService.getSocialLinks();
  sendSuccess(res, { data: socialLinks });
};

const getAppStoreLinks = async (_req, res) => {
  const appStoreLinks = await siteLinksService.getAppStoreLinks();
  sendSuccess(res, { data: appStoreLinks });
};

module.exports = {
  getSiteLinks,
  getContact,
  getSocialLinks,
  getAppStoreLinks,
};
