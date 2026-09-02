import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FiltersSelect from '../Filters/FiltersSelect';
import {
  buildMusicFilterOptions,
  EMPTY_MUSIC_DRAFT,
} from './likeHistoryFilterLogic';

const BODY = '.like-history-filter-modal-body';

/** Klip / konsert — wishlist music panel bilan bir xil (yil, janr, til, mamlakat) */
const LikeHistoryMusicFilters = ({ items = [], draft, onChange }) => {
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
    <div className="like-history-filter-panel like-history-filter-panel--music">
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
          <div className="like-history-filter-section" key={section.key}>
            <h4 className="like-history-filter-section-title">{section.title}</h4>
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

export default LikeHistoryMusicFilters;
