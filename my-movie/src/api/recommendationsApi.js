/**
 * Tavsiyalar — moviesList API/DB dan beriladi
 */
import { getRecommendations } from '../utils/getRecommendations';

const API_URL = process.env.REACT_APP_RECOMMENDATIONS_API_URL;

/**
 * @param {Array} viewedItems
 * @param {number} limit
 * @param {Array} moviesList - API dan kelgan kinolar
 */
export const fetchRecommendations = async (viewedItems, limit = 12, moviesList = []) => {
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
            filterCountry: i.filterCountry,
          })),
          limit,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.movies) ? data.movies : [];
      }
    } catch (e) {
      console.warn('Recommendations API error, using local:', e);
    }
  }
  return getRecommendations(moviesList, viewedItems, limit);
};
