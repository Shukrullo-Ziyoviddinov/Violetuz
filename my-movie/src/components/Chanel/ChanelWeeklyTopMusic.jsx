import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMusicApi } from '../../context/MusicApiContext';
import { useChannelWeeklyTopMusic } from '../../hooks/useChannelWeeklyTopMusic';
import TopMusicChart from '../../Music/TopMusicChart/TopMusicChart';
import './ChanelWeeklyTopMusic.css';

/**
 * Kanal sahifasidagi haftaning top musiqalari.
 * Kartochka musiqa sahifasidagi chart. Raqam rasm emas.
 * Bo‘sh bo‘lsa blok chiqmaydi.
 */
const ChanelWeeklyTopMusic = ({ channelId }) => {
  const { t } = useTranslation();
  const { items, loading } = useChannelWeeklyTopMusic(channelId);
  const { allMusic, musicLoading } = useMusicApi();

  const channelItems = useMemo(() => {
    const byId = new Map((allMusic || []).map((track) => [String(track.id), track]));
    return items.filter((row) => {
      const track = byId.get(String(row.contentId));
      if (!track) return false;
      return String(track.channelId || '') === String(channelId || '');
    });
  }, [allMusic, items, channelId]);

  const waiting = loading || (items.length > 0 && musicLoading && channelItems.length === 0);

  return (
    <TopMusicChart
      items={waiting ? items : channelItems}
      loading={waiting}
      title={t('music.haftaningTopMusiqalari', 'Haftaning top 10 musiqalari')}
      showTextRank
      className="chanel-weekly-top-music"
      skeletonKey="channel-weekly-top-music"
    />
  );
};

export default ChanelWeeklyTopMusic;
