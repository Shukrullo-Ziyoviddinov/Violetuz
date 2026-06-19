/**
 * Musikaga oid konstantalar.
 * Backend/database: Bu qiymatlar faqat UI uchun – API dan kelgan ma'lumotlar uchun alohida limit qo'llanilishi mumkin.
 *
 * Backend uchun kutiladigan item struktura:
 * - Music: { id, artistId?, artist?, img?, title, year?, genre?, audio, lyricsText?, type: 'music' }
 * - Klip: { id, artistId?, img?, title, video, like?, dislike?, type: 'klip'|'konsert' }
 * - Album: { id, title, artist?, artistId?, img?, year?, songs: [{ id, title, artist, audio }], type: 'album' }
 */

export const MUSIC_INITIAL_COUNT = 10;
/** Asosiy sahifada Trend kliplar bo'limida ko'rsatiladigan kartochkalar soni */
export const TREND_CLIPS_INITIAL_COUNT = 10;
/** Asosiy sahifada Jaxon konsertlari bo'limida ko'rsatiladigan kartochkalar soni */
export const JAXON_CONCERTS_INITIAL_COUNT = 10;
/** Asosiy sahifada Discover Music bo'limida ko'rsatiladigan kartochkalar soni */
export const DISCOVER_MUSIC_INITIAL_COUNT = 10;
/** Asosiy sahifada Music Library bo'limida ko'rsatiladigan kartochkalar soni */
export const MUSIC_LIBRARY_INITIAL_COUNT = 10;
/** Asosiy sahifada Top Albomlar bo'limida ko'rsatiladigan kartochkalar soni */
export const TOP_ALBUMS_INITIAL_COUNT = 10;
/** Asosiy sahifada Music Hub bo'limida ko'rsatiladigan kartochkalar soni */
export const MUSIC_HUB_INITIAL_COUNT = 10;
/** Asosiy sahifada Bass Music bo'limida ko'rsatiladigan kartochkalar soni */
export const BASS_MUSIC_INITIAL_COUNT = 10;
/** Asosiy sahifada Top Nasheeds bo'limida ko'rsatiladigan kartochkalar soni */
export const TOP_NASHEEDS_INITIAL_COUNT = 10;
/** Asosiy sahifada Music Drops bo'limida ko'rsatiladigan albomlar soni */
export const MUSIC_DROPS_INITIAL_COUNT = 10;
/** Asosiy sahifada Sevgi va musiqa bo'limida ko'rsatiladigan albomlar soni */
export const SEVGI_VA_MUSIQA_INITIAL_COUNT = 10;
/** Asosiy sahifada Mashhur to'plamlar bo'limida ko'rsatiladigan albomlar soni */
export const HIT_COLLECTIONS_INITIAL_COUNT = 10;
/** Asosiy sahifada Visual Beats klip bo'limida ko'rsatiladigan kartochkalar soni */
export const VISUAL_BEATS_INITIAL_COUNT = 10;
/** Asosiy sahifada Sevgi va ichq klip bo'limida ko'rsatiladigan kartochkalar soni */
export const SEVGI_VA_ICHQ_INITIAL_COUNT = 10;
/** Asosiy sahifada Trenddagi kliplar bo'limida ko'rsatiladigan kartochkalar soni */
export const TREND_VIDEOS_INITIAL_COUNT = 10;
/** Asosiy sahifada Sahnadagi ijod klip bo'limida ko'rsatiladigan kartochkalar soni */
export const STAGE_CREATION_INITIAL_COUNT = 10;
/** Asosiy sahifada Jonli sahnalar konsert bo'limida ko'rsatiladigan kartochkalar soni */
export const LIVE_STAGES_INITIAL_COUNT = 10;
/** Asosiy sahifada Yulduzlar sahasi konsert bo'limida ko'rsatiladigan kartochkalar soni */
export const STARS_STAGE_INITIAL_COUNT = 10;