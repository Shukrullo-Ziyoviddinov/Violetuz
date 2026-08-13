import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FiltersSelect from '../Filters/FiltersSelect';
import {
  buildMusicFilterOptions,
  EMPTY_MUSIC_DRAFT,
} from './wishlistFilterLogic';

const BODY = '.wishlist-filter-modal-body';

/** Musiqa / albom / klip / konsert — MusicFilter selectlari (yosh yo‘q) */
const WishlistMusicFilters = ({ items = [], draft, onChange }) => {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState(null);
  const safeDraft = draft || EMPTY_MUSIC_DRAFT;

  const options = useMemo(
    () => buildMusicFilterOptions(items, safeDraft),
    [items, safeDraft]
  );

  const setField = (key, value) =>
    onChange?.({ ...safeDraft, [key]: value });

  const yearLabel = t('music.filterYear', 'Yil');
  const labels = {
    year: yearLabel,
    genre: t('music.filterGenre', 'Janr'),
    language: t('music.filterLanguage', 'Til'),
    country: t('music.filterCountry', 'Davlat'),
  };

  const sections = [
    {
      key: 'year',
      title: labels.year,
      opts: options.yearOpts,
      format: (v) => `${v}-${yearLabel}`,
    },
    {
      key: 'genre',
      title: labels.genre,
      opts: options.genreOpts,
      format: (v) => String(v),
    },
    {
      key: 'language',
      title: labels.language,
      opts: options.languageOpts,
      format: (v) => String(v),
    },
    {
      key: 'country',
      title: labels.country,
      opts: options.countryOpts,
      format: (v) => String(v),
    },
  ];

  return (
    <div className="wishlist-filter-panel wishlist-filter-panel--music">
      {sections.map((section) => {
        const value = safeDraft[section.key];
        const selectOptions = [
          {
            value: null,
            label: t('categories.all', 'Barchasi'),
          },
          ...section.opts.map((opt) => ({
            value: opt,
            label: section.format(opt),
          })),
        ];

        return (
          <div className="wishlist-filter-section" key={section.key}>
            <h4 className="wishlist-filter-section-title">{section.title}</h4>
            <FiltersSelect
              options={selectOptions}
              value={value}
              open={openSection === section.key}
              onToggle={(next) =>
                setOpenSection(next ? section.key : null)
              }
              onSelect={(val, wasActive) => {
                if (val == null || wasActive) setField(section.key, null);
                else setField(section.key, val);
              }}
              placeholder={section.title}
              bodySelector={BODY}
              isOptionActive={(v) =>
                v == null
                  ? value == null || value === '' || value === 'all'
                  : String(value) === String(v) ||
                    Number(value) === Number(v)
              }
              hasSelection={value != null && value !== '' && value !== 'all'}
              displayText={
                value != null && value !== '' && value !== 'all'
                  ? section.format(value)
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
};

export default WishlistMusicFilters;
