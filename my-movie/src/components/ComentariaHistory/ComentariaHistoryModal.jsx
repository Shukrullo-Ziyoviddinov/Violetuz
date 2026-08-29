import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { fetchCommentHistoryEntries, getShortsRouteFromHistory } from './commentHistoryAggregator';
import { COMMENTS_CHANGED_EVENT } from '../../api/commentsApi';
import { SHORTS_COMMENTS_CHANGED_EVENT } from '../../api/shortsCommentsApi';
import { useAuth } from '../../context/AuthContext';
import { useModalHardwareBack } from '../../useModalHardwareBack';
import ComentariaHistoryFilter from './ComentariaHistoryFilter';
import ComentariaMovieCard from './ComentariaMovieCard';
import ComentariaVideoCard from './ComentariaVideoCard';
import ComentariaShortCard from './ComentariaShortCard';
import ComentariaShortsHeadActions from './ComentariaShortsHeadActions';
import ComentariaTextMore from './ComentariaTextMore';
import ComentariaHistoryTextEdit from './ComentariaHistoryTextEdit';
import ComentariaHistoryTextDelit from './ComentariaHistoryTextDelit';
import LikeButton from '../../Music/LikeButton/LikeButton';
import { formatActionCount } from '../../utils/utils';
import '../MovieDetail/MovieDetail.css';
import '../ShortsVideos/ShortsVideos.css';
import './ComentariaHistoryModal.css';

const isMobileSlideViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

const formatCommentDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '';
  }
};

/** Bir xil kontent (kino / klip / short) uchun bitta kartochka — kalit bir xil bo‘lgan barcha izohlarni yig‘adi */
function groupKeyFromRow(row) {
  const t = row.target;
  if (t.kind === 'movie') {
    const m = t.route?.match(/\/movie\/(\d+)/);
    return m ? `movie:${m[1]}` : row.key;
  }
  if (t.kind === 'triller') {
    return t.trillerId != null ? `triller:${t.trillerId}` : row.key;
  }
  if (t.kind === 'video') {
    const m = t.route?.match(/\/music\/video\/(\d+)/);
    return m ? `video:${m[1]}` : row.key;
  }
  if (t.kind === 'shorts' && t.shortsId != null && t.shortsSource) {
    return `shorts:${t.shortsSource}:${t.shortsId}`;
  }
  return row.key;
}

function groupCommentHistoryRows(rows) {
  const map = new Map();
  for (const row of rows) {
    const k = groupKeyFromRow(row);
    if (!map.has(k)) {
      map.set(k, { key: k, target: row.target, filter: row.filter, rows: [] });
    }
    map.get(k).rows.push(row);
  }
  for (const g of map.values()) {
    g.rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
  return [...map.values()].sort((a, b) => {
    const ta = Math.max(0, ...a.rows.map((r) => new Date(r.createdAt || 0).getTime()));
    const tb = Math.max(0, ...b.rows.map((r) => new Date(r.createdAt || 0).getTime()));
    return tb - ta;
  });
}

/** localStorage kaliti emas — tahrir/o‘chirish uchun API entityKey */
function getCommentPersistence(target) {
  if (!target) return null;
  if (target.kind === 'movie' && target.movieId != null) {
    return { variant: 'movieVideo', entityKey: target.movieId };
  }
  if (target.kind === 'triller' && target.trillerId != null) {
    return { variant: 'movieVideo', entityKey: `triller:${target.trillerId}` };
  }
  if (target.kind === 'video' && target.videoId != null) {
    return { variant: 'movieVideo', entityKey: `music:${target.videoId}` };
  }
  if (target.kind === 'shorts' && target.shortsId != null) {
    return {
      variant: 'shorts',
      entityKey: target.shortsId,
      targetTypeHint:
        target.shortsSource === 'musicshorts' ? 'musicShorts' : 'shorts',
    };
  }
  return null;
}

const ComentariaHistoryModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { isLoggedIn, authReady } = useAuth();
  const lang = contentLang === 'ru' ? 'ru' : 'uz';
  const [filter, setFilter] = useState('all');
  const [tick, setTick] = useState(0);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const slideIn = entered && !exiting;
  const logicalOpen = Boolean(open) && !exiting;
  const visible = Boolean(open) || exiting;

  const refresh = useCallback(() => setTick((x) => x + 1), []);

  const finishClose = () => {
    closingRef.current = false;
    onCloseRef.current?.();
    setExiting(false);
    setEntered(false);
  };

  const beginCloseFromHardware = () => {
    if (closingRef.current || exiting) return;
    if (!isMobileSlideViewport()) {
      onCloseRef.current?.();
      return;
    }
    closingRef.current = true;
    setExiting(true);
  };

  const { releaseHistory, abandonHistory } = useModalHardwareBack({
    historyKey: 'violetComentariaHistory',
    isOpen: logicalOpen,
    onCloseFromHardware: beginCloseFromHardware,
  });

  const requestClose = () => {
    if (closingRef.current || exiting) return;
    if (!isMobileSlideViewport()) {
      releaseHistory();
      onCloseRef.current?.();
      return;
    }
    closingRef.current = true;
    setExiting(true);
    releaseHistory();
  };

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const onRemote = () => refresh();
    window.addEventListener(COMMENTS_CHANGED_EVENT, onRemote);
    window.addEventListener(SHORTS_COMMENTS_CHANGED_EVENT, onRemote);
    window.addEventListener('focus', onRemote);
    return () => {
      window.removeEventListener(COMMENTS_CHANGED_EVENT, onRemote);
      window.removeEventListener(SHORTS_COMMENTS_CHANGED_EVENT, onRemote);
      window.removeEventListener('focus', onRemote);
    };
  }, [open, refresh]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  /** Ochilganda slide-in */
  useEffect(() => {
    if (!open) return undefined;
    closingRef.current = false;
    setExiting(false);
    setEntered(false);
    let innerId = 0;
    const outerId = window.requestAnimationFrame(() => {
      innerId = window.requestAnimationFrame(() => {
        setEntered(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(outerId);
      window.cancelAnimationFrame(innerId);
    };
  }, [open]);

  /** transitionend bo‘lmasa ham unmount */
  useEffect(() => {
    if (!exiting) return undefined;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setTimeout(() => {
      finishClose();
    }, reduced ? 0 : 380);
    return () => window.clearTimeout(id);
  }, [exiting]);

  useEffect(() => {
    if (!open || !authReady) return undefined;
    if (!isLoggedIn) {
      setEntries([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const list = await fetchCommentHistoryEntries(lang);
        if (!cancelled) setEntries(list);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, lang, tick, authReady, isLoggedIn]);

  const filtered = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((e) => e.filter === filter);
  }, [entries, filter]);

  const groupedRows = useMemo(() => groupCommentHistoryRows(filtered), [filtered]);

  const handleModalTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;
    if (!exiting) return;
    finishClose();
  };

  const go = (route) => {
    if (!route) return;
    abandonHistory();
    onCloseRef.current?.();
    setExiting(false);
    setEntered(false);
    closingRef.current = false;
    navigate(route);
  };

  if (!visible) return null;

  const emptyUz = 'Hozircha sharhlar yo‘q';
  const emptyRu = 'Пока нет комментариев';
  const movieBtnUz = 'Kinolar';
  const movieBtnRu = 'Фильмы';
  const musicBtnUz = 'Musiqa';
  const musicBtnRu = 'Музыка';
  const titleUz = 'Sharhlar';
  const titleRu = 'Комментарии';

  return createPortal(
    <>
      <div
        className="comentaria-history-modal-overlay"
        onClick={requestClose}
        role="presentation"
      />
      <div
        className={`comentaria-history-modal${
          slideIn ? ' comentaria-history-modal--in' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={handleModalTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comentaria-history-modal-title"
      >
        <div className="comentaria-history-modal-header">
          <button
            type="button"
            className="comentaria-history-modal-back"
            onClick={requestClose}
            aria-label={lang === 'ru' ? 'Закрыть' : 'Yopish'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 id="comentaria-history-modal-title" className="comentaria-history-modal-title">
            {lang === 'ru' ? titleRu : titleUz}
          </h2>
        </div>

        <ComentariaHistoryFilter active={filter} onChange={setFilter} lang={lang} />

        <div className="comentaria-history-modal-body">
          {loading ? (
            <div className="comentaria-history-modal-empty">
              <p className="comentaria-history-modal-empty-text">
                {lang === 'ru' ? 'Загрузка…' : 'Yuklanmoqda…'}
              </p>
            </div>
          ) : groupedRows.length === 0 ? (
            <div className="comentaria-history-modal-empty">
              <img
                className="comentaria-history-modal-empty-img"
                src="/img/komentpustota_preview_rev_1.png"
                alt=""
                decoding="async"
              />
              <p className="comentaria-history-modal-empty-text">{lang === 'ru' ? emptyRu : emptyUz}</p>
              <div className="comentaria-history-modal-empty-actions">
                <button
                  type="button"
                  className="comentaria-history-modal-empty-btn comentaria-history-modal-empty-btn--movie"
                  onClick={() => go('/')}
                >
                  {lang === 'ru' ? movieBtnRu : movieBtnUz}
                </button>
                <button
                  type="button"
                  className="comentaria-history-modal-empty-btn comentaria-history-modal-empty-btn--music"
                  onClick={() => go('/music')}
                >
                  {lang === 'ru' ? musicBtnRu : musicBtnUz}
                </button>
              </div>
            </div>
          ) : (
            <ul className="comentaria-history-list">
              {groupedRows.map((group) => {
                const t = group.target;
                const f = group.filter;
                const cardClick = () =>
                  go(t.kind === 'shorts' ? getShortsRouteFromHistory(t) : t.route);

                let media = null;
                if (t.kind === 'movie' || t.kind === 'triller') {
                  media = <ComentariaMovieCard title={t.title} image={t.image} onClick={cardClick} />;
                } else if (t.kind === 'video') {
                  const badge =
                    f === 'konsert'
                      ? lang === 'ru'
                        ? 'Концерт'
                        : 'Konsert'
                      : lang === 'ru'
                        ? 'Клип'
                        : 'Klip';
                  media = <ComentariaVideoCard title={t.title} image={t.image} badge={badge} onClick={cardClick} />;
                } else {
                  media = (
                    <ComentariaShortCard title={t.title} image={t.image} videoSrc={t.videoSrc} onClick={cardClick} />
                  );
                }

                const elementTitle =
                  t.kind === 'movie' ||
                  t.kind === 'triller' ||
                  t.kind === 'video' ||
                  t.kind === 'shorts'
                    ? t.title || '—'
                    : '—';

                const mediaClass =
                  t.kind === 'video'
                    ? 'comentaria-history-item-media comentaria-history-item-media--video'
                    : t.kind === 'movie' || t.kind === 'triller'
                      ? 'comentaria-history-item-media comentaria-history-item-media--movie'
                      : 'comentaria-history-item-media comentaria-history-item-media--shorts';

                return (
                  <li key={group.key} className="comentaria-history-item">
                    <div className="comentaria-history-item-top">
                      <div className={mediaClass}>{media}</div>
                      <div className="comentaria-history-item-head-col">
                        <div className="comentaria-history-comment-head">{elementTitle}</div>
                        {t.kind === 'movie' && t.descriptionPreview ? (
                          <div className="movie-detail-description-modal-text comentaria-history-movie-desc-one-line">
                            <p>{t.descriptionPreview}</p>
                          </div>
                        ) : null}
                        {t.kind === 'shorts' && t.descriptionPreview ? (
                          <div className="shorts-modal-description-row">
                            <p className="shorts-modal-description comentaria-history-shorts-desc">{t.descriptionPreview}</p>
                          </div>
                        ) : null}
                        {t.kind === 'shorts' && t.shortsId != null ? (
                          <ComentariaShortsHeadActions
                            shortsId={t.shortsId}
                            shortsSource={t.shortsSource}
                            movieId={t.movieId}
                            musicId={t.musicId}
                            contentType={t.contentType}
                            repostRoute={getShortsRouteFromHistory(t)}
                            repostTitle={t.title || ''}
                            videoSrc={t.videoSrc || ''}
                          />
                        ) : null}
                        {t.kind === 'video' ? (
                          <>
                            {t.artistName ? (
                              <div className="comentaria-history-video-artist">{t.artistName}</div>
                            ) : null}
                            {t.videoId != null ? (
                              <LikeButton
                                contentId={String(t.videoId)}
                                persistKey={`video_${t.videoId}`}
                                initialLikeCount={t.likeCount ?? 0}
                                initialDislikeCount={t.dislikeCount ?? 0}
                                likeMeta={{
                                  category: t.videoType === 'konsert' ? 'konsert' : 'klip',
                                  title: t.title || '',
                                  image: t.image || '',
                                  route: t.route || `/music/video/${t.videoId}`,
                                }}
                                className="comentaria-history-video-like"
                                stopPropagation
                              />
                            ) : null}
                          </>
                        ) : null}
                        {t.kind === 'movie' ? (
                          <>
                            {t.genres?.length ? (
                              <div className="movie-detail-genres">
                                {t.genres.map((g, index) => (
                                  <span key={index} className="movie-detail-genre-badge">
                                    {g}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <div className="movie-detail-rating">
                              {t.movieCategory !== 'anonslar' &&
                              t.rating != null &&
                              t.rating !== '' &&
                              t.rating !== 'none' ? (
                                <div className="movie-detail-rating-item">
                                  <img
                                    src="/img/photo_2026-02-16_20-30-31_preview_rev_1.png"
                                    alt="Rating"
                                    className="movie-detail-rating-logo"
                                  />
                                  <span className="movie-detail-rating-value rating-value-display">
                                    {t.ratingDisplay}
                                  </span>
                                </div>
                              ) : null}
                              {t.ratingImdb != null && t.ratingImdb !== '' && t.ratingImdb !== 'none' ? (
                                <div className="movie-detail-rating-item">
                                  <img src="/img/imdb.jpg" alt="IMDb" className="movie-detail-rating-logo" />
                                  <span className="movie-detail-rating-value">{t.ratingImdb}</span>
                                </div>
                              ) : null}
                              {t.ratingKinopoisk != null &&
                              t.ratingKinopoisk !== '' &&
                              t.ratingKinopoisk !== 'none' ? (
                                <div className="movie-detail-rating-item">
                                  <img
                                    src="/img/kinopoisk.jpg"
                                    alt="Kinopoisk"
                                    className="movie-detail-rating-logo"
                                  />
                                  <span className="movie-detail-rating-value">{t.ratingKinopoisk}</span>
                                </div>
                              ) : null}
                              {t.ratingNetflix != null &&
                              t.ratingNetflix !== '' &&
                              t.ratingNetflix !== 'none' ? (
                                <div className="movie-detail-rating-item">
                                  <img src="/img/netflix.jpg" alt="Netflix" className="movie-detail-rating-logo" />
                                  <span className="movie-detail-rating-value">{t.ratingNetflix}</span>
                                </div>
                              ) : null}
                            </div>
                            {t.movieId != null ? (
                              <div className="movie-detail-actions comentaria-history-movie-detail-actions">
                                <LikeButton
                                  variant="movieDetail"
                                  contentId={String(t.movieId)}
                                  persistKey={`movie_${t.movieId}`}
                                  likeMeta={{
                                    category: 'movie',
                                    title: t.title || '',
                                    image: t.image || '',
                                    route: t.route || `/movie/${t.movieId}`,
                                  }}
                                  initialLikeCount={t.likeCount ?? 0}
                                  initialDislikeCount={t.dislikeCount ?? 0}
                                  countFormatter={formatActionCount}
                                  stopPropagation
                                />
                              </div>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="comentaria-history-item-comment">
                      <ComentariaTextMore lang={lang} items={group.rows}>
                        {(row, { collapsed }) => {
                          const c = row.comment;
                          const persist = getCommentPersistence(t);
                          return (
                            <div className="comentaria-history-comment-entry" hidden={collapsed}>
                              {persist ? (
                                <ComentariaHistoryTextEdit
                                  lang={lang}
                                  commentId={c.id}
                                  variant={persist.variant}
                                  entityKey={persist.entityKey}
                                  targetTypeHint={persist.targetTypeHint}
                                  initialText={c.text}
                                  onPersist={refresh}
                                  deleteSlot={
                                    <ComentariaHistoryTextDelit
                                      lang={lang}
                                      commentId={c.id}
                                      variant={persist.variant}
                                      entityKey={persist.entityKey}
                                      targetTypeHint={persist.targetTypeHint}
                                      onDeleted={refresh}
                                    />
                                  }
                                  render={({ body, actions }) => (
                                    <>
                                      <div className="comentaria-history-comment-block">
                                        <div className="comentaria-history-comment-body">{body}</div>
                                        {c.createdAt ? (
                                          <span className="comentaria-history-comment-time">
                                            {formatCommentDate(c.createdAt)}
                                          </span>
                                        ) : null}
                                      </div>
                                      {actions}
                                    </>
                                  )}
                                />
                              ) : (
                                <div className="comentaria-history-comment-block">
                                  <div className="comentaria-history-comment-body">
                                    <p className="comentaria-history-comment-text">{c.text}</p>
                                  </div>
                                  {c.createdAt ? (
                                    <span className="comentaria-history-comment-time">
                                      {formatCommentDate(c.createdAt)}
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        }}
                      </ComentariaTextMore>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default ComentariaHistoryModal;
