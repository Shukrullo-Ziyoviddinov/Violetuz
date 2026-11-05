import { channelOnly, emptyChannelDraft, filterChannelItems } from './channelFilterLogic';
import { buildMovieDraftOptions, buildMusicFilterOptions } from '../Filters/draftFilterLogic';

const movies = [
  { id: 1, channelId: 'a', rating: 8, filterCountry: 'USA', filterGenre: ['Drama'], ageRestriction: 16 },
  { id: 2, channelId: 'a', rating: 7, filterCountry: 'UK', filterGenre: ['Komediya'], ageRestriction: 12 },
  { id: 3, channelId: 'b', rating: 9, filterCountry: 'Japan', filterGenre: ['Anime'], ageRestriction: 18 },
];

test('movie options and results contain only the selected channel', () => {
  const catalog = channelOnly(movies, 'a');
  const draft = emptyChannelDraft('movie');
  const options = buildMovieDraftOptions(catalog, draft, false);
  expect(options.uniqueRatings).toEqual([8, 7]);
  expect(options.uniqueCountries).toEqual(['UK', 'USA']);
  expect(options.uniqueGenres).not.toContain('Anime');
  expect(options.uniqueAges).not.toContain(18);
  expect(filterChannelItems({ movie: catalog }, {
    type: 'movie', draft: { ...draft, rating: 8, country: 'USA', genres: ['Drama'], age: 16 },
  }).map((item) => item.id)).toEqual([1]);
  expect(filterChannelItems({ movie: catalog }, {
    type: 'movie', draft: { ...draft, country: 'Japan' },
  })).toEqual([]);
});

test.each(['music', 'klip', 'album', 'konsert'])('%s options and results stay within the channel', (type) => {
  const items = [
    { id: 1, channelId: 'a', year: 2024, genre: 'pop', language: 'uz', country: 'uzbekistan' },
    { id: 2, channelId: 'b', year: 2025, genre: 'rock', language: 'en', country: 'usa' },
  ];
  const catalog = channelOnly(items, 'a');
  const draft = emptyChannelDraft(type);
  const options = buildMusicFilterOptions(catalog, draft);
  expect(options.genreOpts).toEqual(['pop']);
  expect(options.countryOpts).toEqual(['uzbekistan']);
  expect(options.yearOpts).toEqual([2024]);
  expect(filterChannelItems({ [type]: catalog }, { type, draft: { ...draft, year: 2024, genre: 'pop' } })).toEqual([items[0]]);
  expect(filterChannelItems({ [type]: catalog }, { type, draft: { ...draft, genre: 'rock' } })).toEqual([]);
  expect(filterChannelItems({ [type]: catalog }, { type, draft })).toEqual(catalog);
});

test('channel ids support numbers and reject missing ids', () => {
  expect(channelOnly([{ channelId: 12 }], '12')).toHaveLength(1);
  expect(channelOnly([{}], undefined)).toEqual([]);
});
