import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdminMe,
  fetchAdminGenres,
  createAdminGenre,
  updateAdminGenre,
  deleteAdminGenre,
  fetchAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
} from '../../api/adminApi';
import AdminMediaField from './AdminMediaField';
import './AdminPage.css';

const emptyGenre = () => ({
  id: '',
  titleUz: '',
  titleRu: '',
  filterGenre: '',
  sortOrder: 0,
  img: '',
});

const emptyBanner = () => ({
  lang: 'uz',
  movieId: '',
  image: '',
  video: '',
});

/**
 * Minimal admin shell — Genres + Banners CRUD with direct-to-R2 uploads.
 * Pattern for future movie/actor/etc. admin screens.
 */
const AdminPage = () => {
  const { isLoggedIn, authReady, profile } = useAuth();
  const [tab, setTab] = useState('genres');
  const [gateError, setGateError] = useState('');
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [genres, setGenres] = useState([]);
  const [genreForm, setGenreForm] = useState(emptyGenre());
  const [editingGenreId, setEditingGenreId] = useState(null);

  const [banners, setBanners] = useState([]);
  const [bannerForm, setBannerForm] = useState(emptyBanner());
  const [editingBannerId, setEditingBannerId] = useState(null);

  const loadGenres = useCallback(async () => {
    const items = await fetchAdminGenres();
    setGenres(Array.isArray(items) ? items : []);
  }, []);

  const loadBanners = useCallback(async () => {
    const items = await fetchAdminBanners();
    setBanners(Array.isArray(items) ? items : []);
  }, []);

  useEffect(() => {
    if (!authReady) return undefined;
    let cancelled = false;

    (async () => {
      if (!isLoggedIn) {
        setAllowed(false);
        setGateError('Admin uchun avval login qiling.');
        return;
      }
      try {
        await fetchAdminMe();
        if (cancelled) return;
        setAllowed(true);
        setGateError('');
        await loadGenres();
        await loadBanners();
      } catch (err) {
        if (cancelled) return;
        setAllowed(false);
        setGateError(
          err.status === 403
            ? 'Admin huquqi yo‘q. .env da ADMIN_EMAILS / ADMIN_USERNAMES ni sozlang.'
            : err.message || 'Admin API xato'
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, loadGenres, loadBanners]);

  const startEditGenre = (g) => {
    setEditingGenreId(g.id);
    setGenreForm({
      id: g.id,
      titleUz: g.title?.uz || '',
      titleRu: g.title?.ru || '',
      filterGenre: Array.isArray(g.filterGenre) ? g.filterGenre.join(', ') : g.filterGenre || '',
      sortOrder: g.sortOrder ?? 0,
      img: g.img || '',
    });
    setMessage('');
  };

  const resetGenreForm = () => {
    setEditingGenreId(null);
    setGenreForm(emptyGenre());
  };

  const saveGenre = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const filterRaw = genreForm.filterGenre.trim();
      const filterGenre = filterRaw.includes(',')
        ? filterRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : filterRaw;

      const payload = {
        title: { uz: genreForm.titleUz.trim(), ru: genreForm.titleRu.trim() },
        filterGenre,
        sortOrder: Number(genreForm.sortOrder) || 0,
        img: genreForm.img || '',
      };

      if (editingGenreId) {
        await updateAdminGenre(editingGenreId, payload);
        setMessage('Genre yangilandi');
      } else {
        await createAdminGenre({ id: genreForm.id.trim(), ...payload });
        setMessage('Genre yaratildi');
      }
      resetGenreForm();
      await loadGenres();
    } catch (err) {
      setMessage(err.message || 'Saqlab bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  const removeGenre = async (id) => {
    if (!window.confirm(`Genre o‘chirilsinmi: ${id}?`)) return;
    setBusy(true);
    try {
      await deleteAdminGenre(id);
      if (editingGenreId === id) resetGenreForm();
      await loadGenres();
      setMessage('Genre o‘chirildi');
    } catch (err) {
      setMessage(err.message || 'O‘chirib bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  const startEditBanner = (b) => {
    setEditingBannerId(b.id);
    setBannerForm({
      lang: b.lang || 'uz',
      movieId: String(b.movieId ?? ''),
      image: b.image || '',
      video: b.video || '',
    });
    setMessage('');
  };

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setBannerForm(emptyBanner());
  };

  const saveBanner = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const payload = {
        lang: bannerForm.lang,
        movieId: Number(bannerForm.movieId),
        image: bannerForm.image || '',
        video: bannerForm.video || '',
      };
      if (editingBannerId) {
        await updateAdminBanner(editingBannerId, payload);
        setMessage('Banner yangilandi');
      } else {
        await createAdminBanner(payload);
        setMessage('Banner yaratildi');
      }
      resetBannerForm();
      await loadBanners();
    } catch (err) {
      setMessage(err.message || 'Saqlab bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  const removeBanner = async (id) => {
    if (!window.confirm(`Banner #${id} o‘chirilsinmi?`)) return;
    setBusy(true);
    try {
      await deleteAdminBanner(id);
      if (editingBannerId === id) resetBannerForm();
      await loadBanners();
      setMessage('Banner o‘chirildi');
    } catch (err) {
      setMessage(err.message || 'O‘chirib bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  if (!authReady) {
    return (
      <div className="admin-page">
        <p className="admin-muted">Auth tekshirilmoqda…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="admin-page">
        <header className="admin-header">
          <h1>Admin</h1>
          <Link to="/">← Sayt</Link>
        </header>
        <p className="admin-error">{gateError}</p>
        <p className="admin-muted">
          Login: {profile?.email || profile?.username || '—'} · role:{' '}
          {profile?.role || 'user'}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>VioletPlay Admin</h1>
          <p className="admin-muted">
            Media: Frontend → R2 (presign). MongoDB faqat URL. Folderlar: img/ | video/ | music/ | avatars/
          </p>
        </div>
        <Link to="/">← Sayt</Link>
      </header>

      <nav className="admin-tabs">
        <button
          type="button"
          className={tab === 'genres' ? 'is-active' : ''}
          onClick={() => setTab('genres')}
        >
          Genres
        </button>
        <button
          type="button"
          className={tab === 'banners' ? 'is-active' : ''}
          onClick={() => setTab('banners')}
        >
          Banners
        </button>
      </nav>

      {message ? <p className="admin-message">{message}</p> : null}

      {tab === 'genres' ? (
        <section className="admin-section">
          <form className="admin-form" onSubmit={saveGenre}>
            <h2>{editingGenreId ? `Edit: ${editingGenreId}` : 'Yangi genre'}</h2>
            {!editingGenreId ? (
              <label>
                id
                <input
                  value={genreForm.id}
                  onChange={(e) => setGenreForm((s) => ({ ...s, id: e.target.value }))}
                  required
                />
              </label>
            ) : null}
            <label>
              title.uz
              <input
                value={genreForm.titleUz}
                onChange={(e) => setGenreForm((s) => ({ ...s, titleUz: e.target.value }))}
                required
              />
            </label>
            <label>
              title.ru
              <input
                value={genreForm.titleRu}
                onChange={(e) => setGenreForm((s) => ({ ...s, titleRu: e.target.value }))}
                required
              />
            </label>
            <label>
              filterGenre (vergul bilan ko‘p)
              <input
                value={genreForm.filterGenre}
                onChange={(e) => setGenreForm((s) => ({ ...s, filterGenre: e.target.value }))}
                required
              />
            </label>
            <label>
              sortOrder
              <input
                type="number"
                value={genreForm.sortOrder}
                onChange={(e) => setGenreForm((s) => ({ ...s, sortOrder: e.target.value }))}
              />
            </label>
            <AdminMediaField
              label="img → img/"
              folder="img"
              value={genreForm.img}
              onChange={(img) => setGenreForm((s) => ({ ...s, img }))}
              disabled={busy}
            />
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn" disabled={busy}>
                {editingGenreId ? 'Yangilash' : 'Yaratish'}
              </button>
              {editingGenreId ? (
                <button type="button" className="admin-btn admin-btn-ghost" onClick={resetGenreForm}>
                  Bekor
                </button>
              ) : null}
            </div>
          </form>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>id</th>
                  <th>title</th>
                  <th>img</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {genres.map((g) => (
                  <tr key={g.id}>
                    <td>{g.id}</td>
                    <td>
                      {g.title?.uz} / {g.title?.ru}
                    </td>
                    <td className="admin-cell-url">{g.img ? '✓' : '—'}</td>
                    <td className="admin-cell-actions">
                      <button type="button" onClick={() => startEditGenre(g)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => removeGenre(g.id)}>
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'banners' ? (
        <section className="admin-section">
          <form className="admin-form" onSubmit={saveBanner}>
            <h2>{editingBannerId ? `Edit banner #${editingBannerId}` : 'Yangi banner'}</h2>
            <label>
              lang
              <select
                value={bannerForm.lang}
                onChange={(e) => setBannerForm((s) => ({ ...s, lang: e.target.value }))}
              >
                <option value="uz">uz</option>
                <option value="ru">ru</option>
              </select>
            </label>
            <label>
              movieId
              <input
                type="number"
                value={bannerForm.movieId}
                onChange={(e) => setBannerForm((s) => ({ ...s, movieId: e.target.value }))}
                required
              />
            </label>
            <AdminMediaField
              label="image → img/"
              folder="img"
              value={bannerForm.image}
              onChange={(image) => setBannerForm((s) => ({ ...s, image }))}
              disabled={busy}
            />
            <AdminMediaField
              label="video → video/"
              folder="video"
              value={bannerForm.video}
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(video) => setBannerForm((s) => ({ ...s, video }))}
              disabled={busy}
            />
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn" disabled={busy}>
                {editingBannerId ? 'Yangilash' : 'Yaratish'}
              </button>
              {editingBannerId ? (
                <button type="button" className="admin-btn admin-btn-ghost" onClick={resetBannerForm}>
                  Bekor
                </button>
              ) : null}
            </div>
          </form>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>id</th>
                  <th>lang</th>
                  <th>movieId</th>
                  <th>media</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.lang}</td>
                    <td>{b.movieId}</td>
                    <td className="admin-cell-url">
                      {b.image ? 'img ' : ''}
                      {b.video ? 'vid' : ''}
                      {!b.image && !b.video ? '—' : ''}
                    </td>
                    <td className="admin-cell-actions">
                      <button type="button" onClick={() => startEditBanner(b)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => removeBanner(b.id)}>
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default AdminPage;
