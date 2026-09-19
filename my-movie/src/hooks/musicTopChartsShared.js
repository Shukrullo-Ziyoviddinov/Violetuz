import { fetchMusicTopCharts } from '../api/musicRecommendationsApi';

/** Music page: weekly + monthly bir so‘rov — parallel mount da dublikat fetch yo‘q. */
let chartsPromise = null;

/**
 * @returns {Promise<{ weekly: { items: Array }, monthly: { items: Array } }>}
 */
export const loadMusicTopChartsOnce = () => {
  if (!chartsPromise) {
    chartsPromise = fetchMusicTopCharts()
      .then((data) => ({
        weekly: {
          items: Array.isArray(data?.weekly?.items) ? data.weekly.items : [],
        },
        monthly: {
          items: Array.isArray(data?.monthly?.items) ? data.monthly.items : [],
        },
      }))
      .catch((err) => {
        chartsPromise = null;
        throw err;
      });
  }
  return chartsPromise;
};
