import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { fetchAllChannels, fetchChannelById } from '../api/channelsApi';
import { requestOpenSearchModal } from '../searchModalBridge';
import ChanelBiografiyaModal from '../components/Chanel/ChanelBiografiyaModal';
import ChanelProfileBanner from '../components/Chanel/ChanelProfileBanner';
import ChanelTypeFilter from '../components/Chanel/ChanelTypeFilter';
import ChanelContent from '../components/Chanel/ChanelContent';
import FollowingButton from '../Music/FollowingButton/FollowingButton';
import { useIsFollowing } from '../context/FollowingContext';
import { useDominantColor } from '../hooks/useDominantColor';
import { formatCount } from '../utils/utils';
import './ChanelPage.css';

const MOBILE_NAV_MAX = 768;
const SWAP_MS = 340;

const formatChannelUsername = (raw) => {
  const username = String(raw || '').trim().replace(/^@+/, '');
  return username ? `@${username}` : '';
};

const clearChannelViewClasses = () => {
  document.body.classList.remove('channel-view-leave', 'channel-view-enter', 'channel-mobile-profile');
};

const ChannelAvatar = ({ channel }) => (
  <div className="channel-page-avatar">
    {channel.avatar ? (
      <img src={channel.avatar} alt="" />
    ) : (
      <span className="channel-page-avatar-fallback" aria-hidden="true">
        {String(channel.name || '?').slice(0, 1)}
      </span>
    )}
  </div>
);

const ChannelNavbarIdentity = ({ channel, onOpen }) => {
  const { i18n } = useTranslation();
  const username = formatChannelUsername(channel.username);
  const isSubscribed = useIsFollowing(channel.id, 'channel');
  const displaySubscribers = (channel.subscribers ?? 0) + (isSubscribed ? 1 : 0);
  const subscriberLabel = String(i18n.language || '').startsWith('ru') ? 'подписчиков' : 'obunachi';

  return (
    <button type="button" className="navbar-channel-identity-btn" onClick={onOpen}>
      <div className="navbar-channel-avatar">
        {channel.avatar ? (
          <img src={channel.avatar} alt="" />
        ) : (
          <span className="navbar-channel-avatar-fallback" aria-hidden="true">
            {String(channel.name || '?').slice(0, 1)}
          </span>
        )}
      </div>
      <div className="navbar-channel-text">
        <p className="navbar-channel-name">{channel.name}</p>
        <div className="navbar-channel-handle">
          {username ? <span className="navbar-channel-username">{username}</span> : null}
          <span className="navbar-channel-subscribers">
            {formatCount(displaySubscribers)} {subscriberLabel}
          </span>
        </div>
      </div>
    </button>
  );
};

const ChannelProfile = ({ channel, onOpenBio }) => {
  const { t, i18n } = useTranslation();
  const [navSlot, setNavSlot] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [contentFilter, setContentFilter] = useState('all');
  const [genreId, setGenreId] = useState(null);
  const [trendIds, setTrendIds] = useState(null);
  const [backIdentity, setBackIdentity] = useState(false);
  const [backScrolled, setBackScrolled] = useState(false);
  const swapLock = useRef(false);
  const swapTimer = useRef(0);
  const preview = String(channel.biografiya?.text || '').replace(/\s+/g, ' ').trim();
  const hasBiography = Boolean(channel.biografiya && (preview || channel.biografiya.link));
  const username = formatChannelUsername(channel.username);
  const isSubscribed = useIsFollowing(channel.id, 'channel');
  const displaySubscribers = (channel.subscribers ?? 0) + (isSubscribed ? 1 : 0);
  const subscriberLabel = String(i18n.language || '').startsWith('ru') ? 'подписчиков' : 'obunachi';
  const avatarColor = useDominantColor(typeof channel.avatar === 'string' ? channel.avatar : null);
  const colorStyle = avatarColor
    ? { '--channel-color': `${avatarColor.r}, ${avatarColor.g}, ${avatarColor.b}` }
    : undefined;

  useLayoutEffect(() => {
    setNavSlot(document.getElementById('navbar-channel-identity'));
    return () => setNavSlot(null);
  }, [channel.id]);

  useEffect(() => () => {
    window.clearTimeout(swapTimer.current);
    clearChannelViewClasses();
  }, []);

  useEffect(() => {
    if (!profileOpen) {
      setBackIdentity(false);
      setBackScrolled(false);
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const scrolled = window.scrollY > 8;
      setBackScrolled((current) => (current === scrolled ? current : scrolled));
      const filter = document.querySelector('.channel-profile .chanel-type-filter');
      const back = document.querySelector('.channel-profile-back');
      if (!filter || !back) return;
      const reached = filter.getBoundingClientRect().top <= back.getBoundingClientRect().bottom + 1;
      setBackIdentity((current) => (current === reached ? current : reached));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [profileOpen]);

  const swapView = (nextOpen) => {
    if (swapLock.current || window.innerWidth > MOBILE_NAV_MAX || nextOpen === profileOpen) return;
    swapLock.current = true;
    document.body.classList.add('channel-view-leave');
    window.clearTimeout(swapTimer.current);
    swapTimer.current = window.setTimeout(() => {
      document.body.classList.toggle('channel-mobile-profile', nextOpen);
      document.body.classList.remove('channel-view-leave');
      document.body.classList.add('channel-view-enter');
      setProfileOpen(nextOpen);
      swapTimer.current = window.setTimeout(() => {
        document.body.classList.remove('channel-view-enter');
        swapLock.current = false;
      }, SWAP_MS);
    }, SWAP_MS);
  };

  const closeProfileView = () => swapView(false);

  return (
    <article
      className={`channel-profile${avatarColor ? ' has-color' : ''}`}
      style={colorStyle}
    >
      {navSlot ? createPortal(
        <ChannelNavbarIdentity channel={channel} onOpen={() => swapView(true)} />,
        navSlot
      ) : null}
      <div className={`channel-profile-back${backScrolled ? ' is-scrolled' : ''}`}>
        <button
          type="button"
          className="channel-profile-back-btn"
          onClick={closeProfileView}
          aria-label="Orqaga"
        >
          <i className="fa-solid fa-angle-left" aria-hidden="true" />
        </button>
        <div className={`channel-profile-back-identity${backIdentity ? ' is-visible' : ''}`} aria-hidden={!backIdentity}>
          <div className="channel-profile-back-id-avatar">
            {channel.avatar ? (
              <img src={channel.avatar} alt="" />
            ) : (
              <span aria-hidden="true">{String(channel.name || '?').slice(0, 1)}</span>
            )}
          </div>
          <div className="channel-profile-back-id-text">
            <p className="channel-profile-back-id-name">{channel.name}</p>
            <div className="channel-profile-back-id-handle">
              {username ? <span>{username}</span> : null}
              <span>{formatCount(displaySubscribers)} {subscriberLabel}</span>
            </div>
          </div>
        </div>
        <div className="channel-profile-back-actions">
          <button
            type="button"
            className="channel-profile-search-btn"
            onClick={requestOpenSearchModal}
            aria-label={t('navbar.search')}
          >
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="channel-profile-more-btn"
            aria-label="Yana"
          >
            <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
          </button>
        </div>
      </div>
      <ChanelProfileBanner profileBanner={channel.profileBanner} />
      <div className="channel-profile-main">
        <ChannelAvatar channel={channel} />
        <div className="channel-page-info">
          <div className="channel-profile-heading">
            <h1 className="channel-page-name">{channel.name}</h1>
            <div className="channel-profile-handle">
              {username ? <p className="channel-profile-username">{username}</p> : null}
              <span className="channel-profile-subscribers">
                {formatCount(displaySubscribers)} {subscriberLabel}
              </span>
            </div>
          </div>
          {hasBiography ? (
            <p className="channel-profile-bio">
              {preview ? <span className="channel-profile-bio-text">{preview}</span> : null}
              <button type="button" className="channel-profile-more" onClick={onOpenBio}>
                ko‘proq
              </button>
            </p>
          ) : null}
          <div className="channel-profile-subscribe">
            <FollowingButton artistId={channel.id} entityType="channel" />
            <button type="button" className="channel-profile-message">
              <i className="fa-solid fa-message" aria-hidden="true" />
              Xabar
            </button>
          </div>
        </div>
      </div>
      <ChanelTypeFilter
        value={contentFilter}
        onChange={setContentFilter}
        channelId={channel.id}
        genreId={genreId}
        onGenreChange={setGenreId}
        onTrendChange={setTrendIds}
      />
      <ChanelContent
        channelId={channel.id}
        filter={contentFilter}
        genreId={genreId}
        trendIds={trendIds}
      />
    </article>
  );
};

const ChannelCard = ({ channel }) => (
  <Link className="channel-page-card" to={`/channel/${encodeURIComponent(channel.id)}`}>
    <ChannelAvatar channel={channel} />
    <div className="channel-page-info">
      <h1 className="channel-page-name">{channel.name}</h1>
    </div>
  </Link>
);

const ChannelCardSkeleton = () => (
  <div className="channel-page-card channel-page-card--skeleton" aria-hidden="true">
    <div className="channel-page-avatar channel-page-avatar--skeleton" />
    <div className="channel-page-name channel-page-name--skeleton" />
  </div>
);

const ChanelPage = () => {
  const { id } = useParams();
  const [channels, setChannels] = useState([]);
  const [status, setStatus] = useState('loading');
  const [bioChannel, setBioChannel] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    const request = id ? fetchChannelById(id) : fetchAllChannels();

    request
      .then((result) => {
        if (cancelled) return;
        if (id) {
          setChannels(result ? [result] : []);
          setStatus(result ? 'ready' : 'missing');
          return;
        }
        setChannels(result);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="channel-page">
      {status === 'loading' && <ChannelCardSkeleton />}
      {status === 'error' && <p className="channel-page-message">Kanallar yuklanmadi</p>}
      {status === 'missing' && <p className="channel-page-message">Kanal topilmadi</p>}
      {status === 'ready' && channels.length === 0 && (
        <p className="channel-page-message">Hozircha kanallar yo‘q</p>
      )}
      {status === 'ready' &&
        channels.map((channel) =>
          id ? (
            <ChannelProfile
              key={channel.id}
              channel={channel}
              onOpenBio={() => setBioChannel(channel)}
            />
          ) : (
            <ChannelCard key={channel.id} channel={channel} />
          )
        )}
      <ChanelBiografiyaModal
        isOpen={Boolean(bioChannel)}
        onClose={() => setBioChannel(null)}
        biografiya={bioChannel?.biografiya}
      />
    </div>
  );
};

export default ChanelPage;
