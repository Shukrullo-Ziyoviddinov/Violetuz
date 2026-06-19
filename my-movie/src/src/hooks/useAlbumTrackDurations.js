import { useState, useEffect } from 'react';

/**
 * Albomdagi har bir qo'shiqning davomiyligini olish
 * @param {Array<{audio: string}>} songs - { audio: url } formatidagi qo'shiqlar massivi
 * @returns {Array<number|null>} har bir qo'shiq uchun sekundlar (yuklanmagan bo'lsa null)
 */
export const useAlbumTrackDurations = (songs) => {
  const [durations, setDurations] = useState([]);

  useEffect(() => {
    if (!songs?.length) {
      setDurations([]);
      return;
    }

    const urls = songs.map((s) => s?.audio).filter(Boolean);
    if (urls.length === 0) {
      setDurations([]);
      return;
    }

    const result = new Array(songs.length).fill(null);
    let loadedCount = 0;
    const audios = [];

    urls.forEach((url, idx) => {
      const audio = new Audio(url);
      audios.push(audio);
      const handler = () => {
        result[idx] = audio.duration;
        loadedCount++;
        if (loadedCount === urls.length) {
          setDurations([...result]);
        }
      };
      audio.addEventListener('loadedmetadata', handler);
      audio.load();
    });

    return () => {
      setDurations([]);
      audios.forEach((a) => {
        a.src = '';
      });
    };
  }, [songs]);

  return durations;
};
