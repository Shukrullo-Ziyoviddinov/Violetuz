import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChanelMovieFilters from './ChanelMovieFilters';
import ChanelMusicFilters from './ChanelMusicFilters';
import useChannelFilterCatalogs from './useChannelFilterCatalogs';
import { CHANNEL_FILTER_TYPES, emptyChannelDraft, filterChannelItems } from './channelFilterLogic';
import './ChanelFilterControls.css';

export default function ChanelFilterControls({ channelId, value, initialType, onApply }) {
  const { t } = useTranslation();
  const catalogs = useChannelFilterCatalogs(channelId);
  const tabs = CHANNEL_FILTER_TYPES.filter((type) => catalogs[type].length > 0);
  const [selected, setSelected] = useState(() => value?.type || initialType || tabs[0]);
  const [drafts, setDrafts] = useState(() => Object.fromEntries(CHANNEL_FILTER_TYPES.map((type) => [
    type, value?.type === type ? { ...value.draft, genres: [...(value.draft.genres || [])] } : emptyChannelDraft(type),
  ])));
  const type = tabs.includes(selected) ? selected : tabs[0];
  const labels = {
    movie: t('channel.movies', 'Kinolar'), music: t('channel.music', 'Musiqalar'),
    klip: t('channel.clips', 'Kliplar'), album: t('channel.albums', 'Albomlar'),
    konsert: t('channel.concerts', 'Konsertlar'),
  };
  const selection = { type, draft: drafts[type] };
  const results = filterChannelItems(catalogs, selection);
  const changeDraft = (draft) => setDrafts((previous) => ({ ...previous, [type]: draft }));

  return (
    <div className="chanel-filter-controls">
      <div className="chanel-filter-fields">
        <div className="chanel-filter-tabs" role="group" aria-label={t('channel.filter', 'Filterlash')}>
          {tabs.map((tab) => (
            <button type="button" key={tab} aria-pressed={tab === type} className={tab === type ? 'active' : ''} onClick={() => setSelected(tab)}>
              {labels[tab]}
            </button>
          ))}
        </div>
        {type === 'movie' ? (
          <ChanelMovieFilters key={type} movies={catalogs.movie} draft={drafts.movie} onChange={changeDraft} />
        ) : type ? (
          <ChanelMusicFilters key={type} items={catalogs[type]} draft={drafts[type]} onChange={changeDraft} />
        ) : <p>{t('channel.noFilterContent', 'Filterlash uchun ma’lumot yo‘q')}</p>}
      </div>
      <div className="chanel-filter-modal-footer">
        <button type="button" className="chanel-filter-modal-clear" disabled={!type} onClick={() => changeDraft(emptyChannelDraft(type))}>
          {t('music.filterClear', 'Tozalash')}
        </button>
        <button type="button" className="chanel-filter-modal-apply" disabled={!type} onClick={() => onApply(selection)}>
          {t('music.showResults', 'Natija')} ({results.length})
        </button>
      </div>
    </div>
  );
}
