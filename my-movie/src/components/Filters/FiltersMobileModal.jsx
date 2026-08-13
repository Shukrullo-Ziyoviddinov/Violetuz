import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import FiltersSelect from './FiltersSelect';
import './FiltersMobile.css';

const DRAG_CLOSE_THRESHOLD = 80;

const RATING_TYPE_KEYS = {
  rating: 'violet',
  ratingImdb: 'imdb',
  ratingKinopoisk: 'kinopoisk',
  ratingNetflix: 'netflix',
};

const RATING_TYPE_LOGOS = {
  rating: '/img/vlplay_preview_rev_1.png',
  ratingImdb: '/img/imdbnew.png',
  ratingKinopoisk: '/img/kinopoisk.jpg',
  ratingNetflix: '/img/netflixnew1.webp',
};

const GENRE_ORDER = [
  'Drama', 'Romantika', 'Sarguzasht', "Qo'rqinchli", 'Jangari', 'Anime',
  'Boevik', 'Komediya', 'Detektiv', 'Oilaviy', 'Fantastika', 'Melodrama',
];

const getRatingFilter = (movie, ratingType, rating) => {
  if (rating == null) return true;
  const val = movie[ratingType];
  return (
    val != null &&
    val !== '' &&
    val !== 'none' &&
    (val == rating || Number(val) === Number(rating))
  );
};

/** Draft bo‘yicha kaskad optionlar */
export const buildDraftOptions = (movies, draft, hideVlFilter) => {
  const ratingType =
    hideVlFilter && draft.ratingType === 'rating' ? 'ratingImdb' : draft.ratingType;

  const moviesForRating = draft.country
    ? movies.filter((m) => m.filterCountry === draft.country)
    : movies;

  const uniqueRatings = [
    ...new Set(
      moviesForRating
        .map((m) => m[ratingType])
        .filter((v) => v != null && v !== '' && v !== 'none')
    ),
  ].sort((a, b) => Number(b) - Number(a));

  const moviesForCountry =
    draft.rating != null
      ? movies.filter((m) => getRatingFilter(m, ratingType, draft.rating))
      : movies;

  const uniqueCountries = [
    ...new Set(moviesForCountry.map((m) => m.filterCountry).filter(Boolean)),
  ].sort();

  let moviesForGenre =
    draft.rating != null
      ? movies.filter((m) => getRatingFilter(m, ratingType, draft.rating))
      : movies;
  if (draft.country) {
    moviesForGenre = moviesForGenre.filter((m) => m.filterCountry === draft.country);
  }
  const allGenres = [...new Set(moviesForGenre.flatMap((m) => m.filterGenre || []))];
  const uniqueGenres = GENRE_ORDER.filter((g) => allGenres.includes(g)).concat(
    allGenres.filter((g) => !GENRE_ORDER.includes(g))
  );

  let moviesForAge =
    draft.rating != null
      ? movies.filter((m) => getRatingFilter(m, ratingType, draft.rating))
      : movies;
  if (draft.country) {
    moviesForAge = moviesForAge.filter((m) => m.filterCountry === draft.country);
  }
  if (draft.genres?.length > 0) {
    moviesForAge = moviesForAge.filter((m) =>
      (m.filterGenre || []).some((g) => draft.genres.includes(g))
    );
  }
  const uniqueAges = [
    ...new Set(moviesForAge.map((m) => m.ageRestriction).filter(Boolean)),
  ].sort((a, b) => a - b);

  const countRating = (r) =>
    moviesForRating.filter((m) => m[ratingType] == r).length;
  const countCountry = (c) =>
    moviesForCountry.filter((m) => m.filterCountry === c).length;
  const countGenre = (g) =>
    moviesForGenre.filter((m) => (m.filterGenre || []).includes(g)).length;
  const countAge = (a) =>
    moviesForAge.filter((m) => m.ageRestriction === a).length;

  return {
    ratingType,
    moviesForRating,
    uniqueRatings,
    countRating,
    uniqueCountries,
    countCountry,
    moviesForCountry,
    uniqueGenres,
    countGenre,
    moviesForGenre,
    uniqueAges,
    countAge,
    moviesForAge,
  };
};

export const applyDraftFilters = (movies, draft, hideVlFilter) => {
  const ratingType =
    hideVlFilter && draft.ratingType === 'rating' ? 'ratingImdb' : draft.ratingType;
  let list = movies;
  if (draft.rating != null) {
    list = list.filter((m) => getRatingFilter(m, ratingType, draft.rating));
  }
  if (draft.country) {
    list = list.filter((m) => m.filterCountry === draft.country);
  }
  if (draft.genres?.length > 0) {
    list = list.filter((m) =>
      (m.filterGenre || []).some((g) => draft.genres.includes(g))
    );
  }
  if (draft.age != null) {
    list = list.filter((m) => m.ageRestriction === draft.age);
  }
  return list;
};

const FiltersMobileModal = ({
  isOpen,
  onClose,
  movies = [],
  draft,
  onDraftChange,
  hideVlFilter = false,
  onClear,
  onApply,
  resultCount = 0,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);
  const isTouch = useRef(false);
  const closeTimerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  const opts = useMemo(
    () => buildDraftOptions(movies, draft, hideVlFilter),
    [movies, draft, hideVlFilter]
  );

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (isOpen) {
      setMounted(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    setOpenSection(null);
    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
      closeTimerRef.current = null;
    }, 320);
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [isOpen]);

  const handleDragStart = useCallback((e) => {
    if (e.target.closest?.('.filters-select')) return;
    isTouch.current = e.type.startsWith('touch');
    isDragging.current = true;
    dragStartY.current = isTouch.current ? e.touches[0].clientY : e.clientY;
    dragCurrentY.current = dragStartY.current;
    const modal = modalRef.current;
    if (modal) modal.style.transition = 'none';
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDragging.current) return;
    const y = isTouch.current ? e.touches[0].clientY : e.clientY;
    dragCurrentY.current = y;
    const modal = modalRef.current;
    if (!modal) return;
    const delta = y - dragStartY.current;
    if (delta > 0) modal.style.transform = `translateY(${delta}px)`;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const modal = modalRef.current;
    if (!modal) return;
    modal.style.transition = '';
    const delta = dragCurrentY.current - dragStartY.current;
    if (delta > DRAG_CLOSE_THRESHOLD) onClose?.();
    modal.style.transform = '';
  }, [onClose]);

  useEffect(() => {
    if (!mounted || !visible) return undefined;
    const onMove = (e) => {
      if (isTouch.current) handleDragMove(e);
    };
    const onEnd = () => handleDragEnd();
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', onEnd);
    };
  }, [mounted, visible, handleDragMove, handleDragEnd]);

  if (!mounted) return null;

  const ratingOptions = [
    {
      value: null,
      label: `${t('categories.all')} (${opts.moviesForRating.length})`,
    },
    ...opts.uniqueRatings.map((r) => ({
      value: r,
      label: `${r} (${opts.countRating(r)})`,
    })),
  ];

  const countryOptions = [
    {
      value: null,
      label: `${t('categories.all')} (${opts.moviesForCountry.length})`,
    },
    ...opts.uniqueCountries.map((c) => ({
      value: c,
      label: `${t(`filters.countries.${c}`, c)} (${opts.countCountry(c)})`,
    })),
  ];

  const genreOptions = [
    {
      value: null,
      label: `${t('categories.all')} (${opts.moviesForGenre.length})`,
    },
    ...opts.uniqueGenres.map((g) => ({
      value: g,
      label: `${t(`filters.genres.${g}`, g)} (${opts.countGenre(g)})`,
    })),
  ];

  const ageOptions = [
    {
      value: null,
      label: `${t('categories.all')} (${opts.moviesForAge.length})`,
    },
    ...opts.uniqueAges.map((a) => ({
      value: a,
      label: `${t(`filters.ages.${a}`, `${a}+`)} (${opts.countAge(a)})`,
    })),
  ];

  const setField = (patch) => onDraftChange?.({ ...draft, ...patch });

  return createPortal(
    <div
      className={`filters-mobile-modal-overlay${visible ? ' open' : ''}`}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="filters-mobile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="filters-mobile-modal-header"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <span className="filters-mobile-modal-drag-bar" aria-hidden="true" />
          <div className="filters-mobile-modal-header-row">
            <h3 className="filters-mobile-modal-title">
              {t('music.searchAndFilter', 'Qidirish va filterlash')}
            </h3>
          </div>
        </div>

        <div className="filters-mobile-modal-body filters-modal-sheet-body">
          {/* Reyting: title + type row + select */}
          <div className="filters-mobile-section">
            <h4 className="filters-mobile-section-title">{t('detail.rating')}</h4>
            <div className="filters-modal-reyting-type-row">
              {Object.entries(RATING_TYPE_KEYS)
                .filter(([field]) => !(hideVlFilter && field === 'rating'))
                .map(([field, key]) => (
                  <button
                    key={field}
                    type="button"
                    className={`filters-modal-reyting-type-btn${
                      opts.ratingType === field
                        ? ' filters-modal-reyting-type-btn--active'
                        : ''
                    }`}
                    onClick={() => {
                      setField({ ratingType: field, rating: null });
                      setOpenSection(null);
                    }}
                  >
                    <img
                      src={RATING_TYPE_LOGOS[field]}
                      alt={t(`filters.ratingTypes.${key}`)}
                      className={`filters-modal-reyting-type-img${
                        field === 'ratingNetflix'
                          ? ' filters-modal-reyting-type-img--netflix'
                          : ''
                      }`}
                    />
                  </button>
                ))}
            </div>
            <FiltersSelect
              options={ratingOptions}
              value={draft.rating}
              open={openSection === 'rating'}
              onToggle={(next) => setOpenSection(next ? 'rating' : null)}
              onSelect={(val, wasActive) => {
                if (val == null || wasActive) setField({ rating: null });
                else setField({ rating: val });
              }}
              placeholder={t('detail.rating')}
              bodySelector=".filters-mobile-modal-body"
              isOptionActive={(v) =>
                v == null
                  ? draft.rating == null
                  : draft.rating == v || Number(draft.rating) === Number(v)
              }
              hasSelection={draft.rating != null}
              displayText={
                draft.rating != null
                  ? `${draft.rating} (${opts.countRating(draft.rating)})`
                  : undefined
              }
            />
          </div>

          {/* Mamlakat */}
          <div className="filters-mobile-section">
            <h4 className="filters-mobile-section-title">
              {t('filters.country', 'Mamlakat')}
            </h4>
            <FiltersSelect
              options={countryOptions}
              value={draft.country}
              open={openSection === 'country'}
              onToggle={(next) => setOpenSection(next ? 'country' : null)}
              onSelect={(val, wasActive) => {
                if (val == null || wasActive) setField({ country: null });
                else setField({ country: val });
              }}
              placeholder={t('filters.country', 'Mamlakat')}
              bodySelector=".filters-mobile-modal-body"
              isOptionActive={(v) =>
                v == null ? draft.country == null : draft.country === v
              }
              hasSelection={draft.country != null}
              displayText={
                draft.country != null
                  ? `${t(`filters.countries.${draft.country}`, draft.country)} (${opts.countCountry(draft.country)})`
                  : undefined
              }
            />
          </div>

          {/* Janr */}
          <div className="filters-mobile-section">
            <h4 className="filters-mobile-section-title">
              {t('filters.genre', 'Janr')}
            </h4>
            <FiltersSelect
              options={genreOptions}
              open={openSection === 'genre'}
              onToggle={(next) => setOpenSection(next ? 'genre' : null)}
              onSelect={(val, wasActive) => {
                if (val == null) {
                  setField({ genres: [] });
                  return;
                }
                if (wasActive) {
                  setField({
                    genres: (draft.genres || []).filter((g) => g !== val),
                  });
                  return;
                }
                setField({ genres: [...(draft.genres || []), val] });
              }}
              placeholder={t('filters.genre', 'Janr')}
              bodySelector=".filters-mobile-modal-body"
              isOptionActive={(v) =>
                v == null
                  ? !(draft.genres?.length)
                  : (draft.genres || []).includes(v)
              }
              hasSelection={(draft.genres || []).length > 0}
              displayText={
                (draft.genres || []).length > 0
                  ? draft.genres
                      .map((g) => t(`filters.genres.${g}`, g))
                      .join(', ')
                  : undefined
              }
            />
          </div>

          {/* Yosh */}
          <div className="filters-mobile-section">
            <h4 className="filters-mobile-section-title">
              {t('filters.age', 'Yosh')}
            </h4>
            <FiltersSelect
              options={ageOptions}
              value={draft.age}
              open={openSection === 'age'}
              onToggle={(next) => setOpenSection(next ? 'age' : null)}
              onSelect={(val, wasActive) => {
                if (val == null || wasActive) setField({ age: null });
                else setField({ age: val });
              }}
              placeholder={t('filters.age', 'Yosh')}
              bodySelector=".filters-mobile-modal-body"
              isOptionActive={(v) =>
                v == null ? draft.age == null : draft.age === v
              }
              hasSelection={draft.age != null}
              displayText={
                draft.age != null
                  ? `${t(`filters.ages.${draft.age}`, `${draft.age}+`)} (${opts.countAge(draft.age)})`
                  : undefined
              }
            />
          </div>
        </div>

        <div className="filters-mobile-modal-footer">
          <button
            type="button"
            className="filters-mobile-modal-clear"
            onClick={() => {
              onClear?.();
              setOpenSection(null);
            }}
          >
            {t('music.filterClear', 'Tozalash')}
          </button>
          <button
            type="button"
            className="filters-mobile-modal-apply"
            onClick={onApply}
          >
            {t('music.showResults', 'Natijaga')}
            {resultCount > 0 ? ` (${resultCount})` : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FiltersMobileModal;
