'use strict';

/**
 * Xabarlar sahifasidagi o‘z kartasi.
 * Email, parol va rol chiqmaydi. Xona yaratilmaydi.
 */
const toMessageSelf = (user) => {
  if (!user) return null;
  const id = String(user._id || user.id || '').trim();
  const name = String(user.name || '').trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    username: String(user.username || '').trim(),
    avatar: String(user.avatar || '').trim(),
  };
};

module.exports = {
  toMessageSelf,
};
