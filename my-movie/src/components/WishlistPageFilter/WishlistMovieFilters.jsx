import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FiltersSelect from '../Filters/FiltersSelect';
import {
  buildMovieDraftOptions,
  EMPTY_MOVIE_DRAFT,
} from './wishlistFilterLogic';

const RATING_TYPE_KEYS = {
  rating: 'violet',
  ratingImdb: 'imdb',
  ratingKinopoisk: 'kinopoisk',
  ratingNetflix: 'netflix',
};

const RATING_TYPE_LOGOS = {
  rating: '/img/photo_2026-02-16_20-30-31_preview_rev_1.png',
  ratingImdb: '/img/imdb.jpg',
  ratingKinopoisk: '/img/kinopoisk.jpg',
  ratingNetflix: '/img/netflix.jpg',
};

const BODY = '.wishlist-filter-modal-body';

/** Kino filterlari — Filters mobil body bilan bir xil ishlash */
const WishlistMovieFilters = ({ movies = [], draft, onChange }) => {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState(null);
  const safeDraft = draft || EMPTY_MOVIE_DRAFT;

  const opts = useMemo(
    () => buildMovieDraftOptions(movies, safeDraft, false),
    [movies, safeDraft]
  );

  const setField = (patch) => onChange?.({ ...safeDraft, ...patch });

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

  return (
    <div className="wishlist-filter-panel wishlist-filter-panel--movie">
      <div className="wishlist-filter-section">
        <h4 className="wishlist-filter-section-title">{t('detail.rating')}</h4>
        <div className="filters-modal-reyting-type-row">
          {Object.entries(RATING_TYPE_KEYS).map(([field, key]) => (
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
                className="filters-modal-reyting-type-img"
              />
            </button>
          ))}
        </div>
        <FiltersSelect
          options={ratingOptions}
          value={safeDraft.rating}
          open={openSection === 'rating'}
          onToggle={(next) => setOpenSection(next ? 'rating' : null)}
          onSelect={(val, wasActive) => {
            if (val == null || wasActive) setField({ rating: null });
            else setField({ rating: val });
          }}
          placeholder={t('detail.rating')}
          bodySelector={BODY}
          isOptionActive={(v) =>
            v == null
              ? safeDraft.rating == null
              : safeDraft.rating == v || Number(safeDraft.rating) === Number(v)
          }
          hasSelection={safeDraft.rating != null}
          displayText={
            safeDraft.rating != null
              ? `${safeDraft.rating} (${opts.countRating(safeDraft.rating)})`
              : undefined
          }
        />
      </div>

      <div className="wishlist-filter-section">
        <h4 className="wishlist-filter-section-title">
          {t('filters.country', 'Mamlakat')}
        </h4>
        <FiltersSelect
          options={countryOptions}
          value={safeDraft.country}
          open={openSection === 'country'}
          onToggle={(next) => setOpenSection(next ? 'country' : null)}
          onSelect={(val, wasActive) => {
            if (val == null || wasActive) setField({ country: null });
            else setField({ country: val });
          }}
          placeholder={t('filters.country', 'Mamlakat')}
          bodySelector={BODY}
          isOptionActive={(v) =>
            v == null ? safeDraft.country == null : safeDraft.country === v
          }
          hasSelection={safeDraft.country != null}
          displayText={
            safeDraft.country != null
              ? `${t(`filters.countries.${safeDraft.country}`, safeDraft.country)} (${opts.countCountry(safeDraft.country)})`
              : undefined
          }
        />
      </div>

      <div className="wishlist-filter-section">
        <h4 className="wishlist-filter-section-title">
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
                genres: (safeDraft.genres || []).filter((g) => g !== val),
              });
              return;
            }
            setField({ genres: [...(safeDraft.genres || []), val] });
          }}
          placeholder={t('filters.genre', 'Janr')}
          bodySelector={BODY}
          isOptionActive={(v) =>
            v == null
              ? !(safeDraft.genres?.length)
              : (safeDraft.genres || []).includes(v)
          }
          hasSelection={(safeDraft.genres || []).length > 0}
          displayText={
            (safeDraft.genres || []).length > 0
              ? safeDraft.genres
                  .map((g) => t(`filters.genres.${g}`, g))
                  .join(', ')
              : undefined
          }
        />
      </div>

      <div className="wishlist-filter-section">
        <h4 className="wishlist-filter-section-title">
          {t('filters.age', 'Yosh')}
        </h4>
        <FiltersSelect
          options={ageOptions}
          value={safeDraft.age}
          open={openSection === 'age'}
          onToggle={(next) => setOpenSection(next ? 'age' : null)}
          onSelect={(val, wasActive) => {
            if (val == null || wasActive) setField({ age: null });
            else setField({ age: val });
          }}
          placeholder={t('filters.age', 'Yosh')}
          bodySelector={BODY}
          isOptionActive={(v) =>
            v == null ? safeDraft.age == null : safeDraft.age === v
          }
          hasSelection={safeDraft.age != null}
          displayText={
            safeDraft.age != null
              ? `${t(`filters.ages.${safeDraft.age}`, `${safeDraft.age}+`)} (${opts.countAge(safeDraft.age)})`
              : undefined
          }
        />
      </div>
    </div>
  );
};

export default WishlistMovieFilters;
