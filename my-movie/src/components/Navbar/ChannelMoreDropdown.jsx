import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import ShareButton from '../ShareButton/ShareButton';
import { fetchChannelById } from '../../api/channelsApi';
import './ChannelMoreDropdown.css';

export default function ChannelMoreDropdown({ channelId }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const { data: channel, isError, refetch } = useQuery({
    queryKey: ['channel-share', channelId],
    queryFn: () => fetchChannelById(channelId),
    enabled: Boolean(open && channelId),
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const resize = () => { if (window.innerWidth > 768) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="navbar-channel-more"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="navbar-mobile-action-btn navbar-channel-more-btn"
        aria-label={t('navbar.more', 'Yana')}
        aria-expanded={open}
        aria-controls="navbar-channel-more-dropdown"
        onClick={() => setOpen((previous) => !previous)}
      >
        <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
      </button>
      <div
        id="navbar-channel-more-dropdown"
        className={`navbar-channel-more-dropdown${open ? ' is-open' : ''}`}
        inert={!open}
      >
        {channel ? (
          <div className="navbar-channel-share" onClickCapture={() => setOpen(false)}>
            <ShareButton
              movie={{ id: channel.id, title: channel.name, img: channel.avatar }}
              sharePath={`/channel/${encodeURIComponent(channel.id)}`}
              absoluteUrl={`https://www.violetplay.uz/channel/${encodeURIComponent(channel.id)}`}
              label={t('channel.share', 'Ulashish')}
              buttonClassName="navbar-channel-more-item"
              dropdownInPortal
            />
          </div>
        ) : (
          <button type="button" className="navbar-channel-more-item" disabled={!isError} onClick={() => refetch()}>
            <i className="fa-solid fa-share-nodes" aria-hidden="true" />
            <span>{isError ? t('channel.shareRetry', 'Qayta urinish') : t('channel.share', 'Ulashish')}</span>
          </button>
        )}
        <button type="button" className="navbar-channel-more-item navbar-channel-more-item--delete">
          <i className="fa-solid fa-trash-can" aria-hidden="true" />
          <span>{t('channel.delete', "O'chirish")}</span>
        </button>
      </div>
    </div>
  );
}
