import { useState, useEffect } from 'react';

/**
 * Albomdagi barcha qo'shiqlarning jami davomiyligini hisoblaydi
 * @param {Array<{audio: string}>} songs - { audio: url } formatidagi qo'shiqlar massivi
 * @returns {number|null} jami sekundlar yoki null (yuklanmoqda)
 */
export const useAlbumTotalDuration = (songs) => {
  const [totalSeconds, setTotalSeconds] = useState(null);

  useEffect(() => {
    if (!songs?.length) {
      setTotalSeconds(null);
      return;
    }

    const urls = songs.map((s) => s?.audio).filter(Boolean);
    if (urls.length === 0) {
      setTotalSeconds(null);
      return;
    }

    const loaded = {};
    let loadedCount = 0;

    const checkComplete = () => {
      if (loadedCount !== urls.length) return;
      const total = Object.values(loaded).reduce((sum, d) => sum + (d || 0), 0);
      setTotalSeconds(total);
    };

    const audios = [];
    urls.forEach((url, idx) => {
      const audio = new Audio(url);
      audios.push(audio);
      const handler = () => {
        loaded[idx] = audio.duration;
        loadedCount++;
        checkComplete();
      };
      audio.addEventListener('loadedmetadata', handler);
      audio.load();
    });

    return () => {
      setTotalSeconds(null);
      audios.forEach((a) => {
        a.src = '';
      });
    };
  }, [songs]);

  return totalSeconds;
};
