import { EMPTY_MOVIE_DRAFT, EMPTY_MUSIC_DRAFT, applyMovieDraftFilters, applyMusicDraftFilters } from '../Filters/draftFilterLogic';

export const CHANNEL_FILTER_TYPES = ['movie', 'music', 'klip', 'album', 'konsert'];
export const emptyChannelDraft = (type) => type === 'movie'
  ? { ...EMPTY_MOVIE_DRAFT, genres: [] }
  : { ...EMPTY_MUSIC_DRAFT };

export const channelOnly = (items, channelId) => (items || []).filter(
  (item) => channelId != null && channelId !== '' && String(item.channelId ?? '') === String(channelId)
);

export const filterChannelItems = (catalogs, selection) => {
  const items = catalogs[selection?.type] || [];
  return selection?.type === 'movie'
    ? applyMovieDraftFilters(items, selection.draft || emptyChannelDraft('movie'), false)
    : applyMusicDraftFilters(items, selection?.draft || EMPTY_MUSIC_DRAFT);
};
