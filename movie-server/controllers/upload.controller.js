const r2Service = require('../services/r2Service');
const { sendSuccess } = require('../utils/response');
const { badRequest } = require('../utils/errors');

const isAdminUser = (req) => req.authUser?.role === 'admin';

/**
 * POST /uploads/presign
 * Body: { folder, contentType, filename? }
 * → { uploadUrl, publicUrl, key, expiresIn, headers }
 *
 * Client/admin then PUT the file bytes directly to uploadUrl (not to this server).
 */
const createPresign = async (req, res) => {
  const { folder, contentType, filename, expiresIn } = req.body || {};

  if (!folder || !contentType) {
    throw badRequest('folder and contentType are required');
  }

  const data = await r2Service.createPresignedUpload({
    folder,
    contentType,
    filename,
    expiresIn,
    isAdmin: isAdminUser(req),
  });

  sendSuccess(res, { data }, 200);
};

/**
 * POST /uploads/delete
 * Body: { key } or { url }
 * Removes the object from R2. Does not touch MongoDB (caller owns DB updates).
 * url must be under R2_PUBLIC_URL — foreign hosts are rejected.
 */
const deleteUpload = async (req, res) => {
  const { key, url } = req.body || {};
  const objectKey = r2Service.resolveObjectKey(key || url);

  if (!objectKey) {
    throw badRequest(
      'key yoki R2_PUBLIC_URL ostidagi url kerak (boshqa domen URL qabul qilinmaydi)'
    );
  }

  const folder = objectKey.includes('/')
    ? objectKey.slice(0, objectKey.lastIndexOf('/'))
    : objectKey;
  r2Service.assertUploadFolderAccess(folder, { isAdmin: isAdminUser(req) });

  const data = await r2Service.deleteObject(objectKey);
  sendSuccess(res, { data });
};

module.exports = {
  createPresign,
  deleteUpload,
};
