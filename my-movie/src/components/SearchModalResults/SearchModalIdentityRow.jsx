import React from 'react';

const displayUsername = (username) => {
  const value = String(username || '').trim().replace(/^@+/, '');
  return value ? `@${value}` : '';
};

const SearchModalIdentityRow = ({ name, username, avatar, onClick }) => {
  const handle = displayUsername(username);
  const title = String(name || '').trim() || handle.replace(/^@/, '');
  const initial = (title || '?').charAt(0).toUpperCase();
  const interactive = typeof onClick === 'function';

  const content = (
    <>
      {avatar ? (
        <img className="search-modal-identity-avatar" src={avatar} alt="" />
      ) : (
        <span className="search-modal-identity-avatar search-modal-identity-avatar--fallback" aria-hidden="true">
          {initial}
        </span>
      )}
      <span className="search-modal-identity-copy">
        <span className="search-modal-identity-name">{title}</span>
        {handle ? <span className="search-modal-identity-username">{handle}</span> : null}
      </span>
    </>
  );

  if (!interactive) {
    return <div className="search-modal-identity-row">{content}</div>;
  }

  return (
    <button type="button" className="search-modal-identity-row search-modal-identity-row--link" onClick={onClick}>
      {content}
    </button>
  );
};

export default SearchModalIdentityRow;
