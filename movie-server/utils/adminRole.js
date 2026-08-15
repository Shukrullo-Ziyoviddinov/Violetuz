const { ADMIN_EMAILS, ADMIN_USERNAMES } = require('../config/env');

/**
 * Sync user.role from ADMIN_EMAILS / ADMIN_USERNAMES env lists.
 * If both lists are empty, leave the DB role unchanged (manual promote OK).
 */
const syncAdminRole = async (user) => {
  if (!user) return user;

  const listsConfigured = ADMIN_EMAILS.size > 0 || ADMIN_USERNAMES.size > 0;
  if (!listsConfigured) return user;

  const byEmail = ADMIN_EMAILS.has(String(user.emailNormalized || '').toLowerCase());
  const byUsername = ADMIN_USERNAMES.has(
    String(user.usernameNormalized || '')
      .toLowerCase()
      .replace(/^@+/, '')
  );
  const wantAdmin = byEmail || byUsername;
  const nextRole = wantAdmin ? 'admin' : 'user';

  if (user.role !== nextRole) {
    user.role = nextRole;
    await user.save();
  }

  return user;
};

module.exports = {
  syncAdminRole,
};
