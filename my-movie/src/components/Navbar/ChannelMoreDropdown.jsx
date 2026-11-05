import React, { useEffect, useLayoutEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import ShareButton from '../ShareButton/ShareButton';
import { fetchChannelById } from '../../api/channelsApi';
import './ChannelMoreDropdown.css';

export default function ChannelMoreDropdown({ channelId, profile = false }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownId = useId();
  const [position, setPosition] = useState({});

  useLayoutEffect(() => {
    if (!open || !profile) return undefined;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPosition({ position: 'fixed', top: rect.bottom + 10, right: Math.max(8, window.innerWidth - rect.right), zIndex: 1100 });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, profile]);
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
      if (!wrapperRef.current?.contains(event.target) && !dropdownRef.current?.contains(event.target)) setOpen(false);
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

  const dropdown = (
      <div
        ref={dropdownRef}
        id={dropdownId}
        className={`navbar-channel-more-dropdown${open ? ' is-open' : ''}`}
        style={profile ? position : undefined}
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
  );

  return (
    <div
      ref={wrapperRef}
      className="navbar-channel-more"
      onBlur={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget) && !dropdownRef.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={profile ? 'channel-profile-more-btn' : 'navbar-mobile-action-btn navbar-channel-more-btn'}
        aria-label={t('navbar.more', 'Yana')}
        aria-expanded={open}
        aria-controls={dropdownId}
        onClick={() => setOpen((previous) => !previous)}
      >
        <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
      </button>
      {profile ? createPortal(dropdown, document.body) : dropdown}
    </div>
  );
}
