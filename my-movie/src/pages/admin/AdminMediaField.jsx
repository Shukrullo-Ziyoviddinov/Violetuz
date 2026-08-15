import React, { useState } from 'react';
import { uploadFileDirectToR2 } from '../../api/uploadsApi';

/**
 * Direct-to-R2 media picker for admin forms.
 * Uploads file → returns publicUrl via onChange. Bytes never hit Node.
 */
const AdminMediaField = ({
  label,
  folder,
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp,image/avif,image/gif',
  disabled = false,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || disabled) return;

    setError('');
    setBusy(true);
    try {
      const { publicUrl } = await uploadFileDirectToR2({ folder, file });
      onChange(publicUrl);
    } catch (err) {
      setError(err.message || 'Upload xato');
    } finally {
      setBusy(false);
    }
  };

  const isVideo = typeof value === 'string' && /\.(mp4|webm|mov)(\?|$)/i.test(value);

  return (
    <div className="admin-media-field">
      <div className="admin-media-field-label">{label}</div>
      <div className="admin-media-field-row">
        <div className="admin-media-preview">
          {value ? (
            isVideo ? (
              <video src={value} muted playsInline className="admin-media-preview-el" />
            ) : (
              <img src={value} alt="" className="admin-media-preview-el" />
            )
          ) : (
            <span className="admin-media-empty">URL yo‘q</span>
          )}
        </div>
        <div className="admin-media-actions">
          <label className={`admin-btn admin-btn-secondary${busy || disabled ? ' is-disabled' : ''}`}>
            {busy ? 'Yuklanmoqda…' : 'R2 ga yuklash'}
            <input
              type="file"
              accept={accept}
              hidden
              disabled={busy || disabled}
              onChange={handleFile}
            />
          </label>
          {value ? (
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              disabled={busy || disabled}
              onClick={() => onChange('')}
            >
              Tozalash
            </button>
          ) : null}
        </div>
      </div>
      {value ? <code className="admin-media-url">{value}</code> : null}
      {error ? <p className="admin-error">{error}</p> : null}
    </div>
  );
};

export default AdminMediaField;
