import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchChannelById } from '../../api/channelsApi';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';

const ShortsChannelHead = ({ item, onWatchClick }) => {
  const channelId = String(item?.channelId || '').trim();
  const { data: channel } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: () => fetchChannelById(channelId),
    enabled: Boolean(channelId),
  });

  if (!channelId || !channel) return null;

  const handleClick = (event) => {
    event.stopPropagation();
    onWatchClick?.();
  };

  return (
    <div className="shorts-modal-channel-row">
      <Link
        to={`/channel/${encodeURIComponent(channel.id || channelId)}`}
        className="shorts-modal-channel-head"
        onClick={handleClick}
        aria-label={channel.name || undefined}
      >
        <div className="shorts-modal-channel-avatar">
          {channel.avatar ? (
            <img src={channel.avatar} alt="" />
          ) : (
            <span aria-hidden="true">{String(channel.name || '?').slice(0, 1)}</span>
          )}
        </div>
      </Link>
      <div className="shorts-modal-channel-copy">
        <Link
          to={`/channel/${encodeURIComponent(channel.id || channelId)}`}
          className="shorts-modal-channel-meta"
          onClick={handleClick}
        >
          <div className="shorts-modal-channel-name">{channel.name}</div>
          <div className="shorts-modal-channel-type">Kanal</div>
        </Link>
        <FollowingButton
          artistId={channel.id || channelId}
          entityType="channel"
          stopPropagation
          wrapperClassName="shorts-modal-channel-follow"
        />
      </div>
    </div>
  );
};

export default ShortsChannelHead;
