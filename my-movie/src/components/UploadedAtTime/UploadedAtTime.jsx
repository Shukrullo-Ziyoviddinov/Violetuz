import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatUploadedAt } from '../../utils/formatUploadedAt';
import './UploadedAtTime.css';

/**
 * Kontent yuklangan vaqt (createdAt) — relative matn.
 * Admin create → Mongo timestamps avtomatik; qo‘lda kiritish yo‘q.
 */
const UploadedAtTime = ({
  at,
  className = '',
  showDot = true,
}) => {
  const { i18n } = useTranslation();
  const label = formatUploadedAt(at, i18n.language);
  if (!label) return null;

  return (
    <span
      className={`uploaded-at-time ${className}`.trim()}
      role="status"
      aria-label={label}
      title={label}
    >
      {showDot ? <span className="uploaded-at-time-dot" aria-hidden="true">·</span> : null}
      <span className="uploaded-at-time-text">{label}</span>
    </span>
  );
};

export default UploadedAtTime;
