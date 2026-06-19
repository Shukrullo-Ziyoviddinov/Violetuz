/**
 * Tavsiyalar API - backend ulash uchun
 * Backend tayyor bo'lganda REACT_APP_RECOMMENDATIONS_API_URL ni o'rnating
 * va fetchRecommendations ichida API ga so'rov yuboring
 */
import { allMovies } from '../data/movies';
import { getRecommendations } from '../utils/getRecommendations';

const API_URL = process.env.REACT_APP_RECOMMENDATIONS_API_URL;

/**
 * Backend orqali tavsiyalar olish
 * @param {Array<{id, typeCategory?, filterGenre?, filterCountry?}>} viewedItems - ko'rgan kinolar
 * @param {number} limit - maksimal soni
 * @returns {Promise<Array>} - tavsiya qilingan kinolar
 */
export const fetchRecommendations = async (viewedItems, limit = 12) => {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}?limit=${limit}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewedIds: viewedItems.map((i) => i.id),
          viewedMeta: viewedItems.map((i) => ({
            id: i.id,
            typeCategory: i.typeCategory,
            filterGenre: i.filterGenre,
            filterCountry: i.filterCountry
          })),
          limit
        })
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.movies) ? data.movies : [];
      }
    } catch (e) {
      console.warn('Recommendations API error, using local:', e);
    }
  }
  return getRecommendations(allMovies, viewedItems, limit);
};
