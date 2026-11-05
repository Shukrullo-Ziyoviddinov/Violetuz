import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import TrailerHomeCard from './TrailerHomeCard';
import HorizontalScroll from '../components/HorizontalScroll/HorizontalScroll';
import { fetchTrailerHomeFeed } from './feedApi';
import './HomeTrailerSection.css';

export default function HomeTrailerSection() {
  const { t } = useTranslation();
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!authReady) return undefined;
    const controller = new AbortController();
    setResult(null);
    fetchTrailerHomeFeed({ isLoggedIn, signal: controller.signal })
      .then((items) => { if (!controller.signal.aborted) setResult({ isLoggedIn, items }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ isLoggedIn, items: [] }); });
    return () => controller.abort();
  }, [authReady, isLoggedIn]);
  const ready = authReady && result?.isLoggedIn === isLoggedIn;
  if (ready && !result.items.length) return null;
  return <section className="home-trailer-section" aria-label={t('homeTrailers', { defaultValue: 'Treylerlar' })}>
    <h2>{t('homeTrailers', { defaultValue: 'Treylerlar' })}</h2>
    <div className="home-trailer-section-row" aria-busy={!ready}>
      <HorizontalScroll>
      {ready ? result.items.map((item) => <TrailerHomeCard key={item.key} item={item} />)
        : Array.from({ length: 5 }, (_, index) => <div key={index} className="home-trailer-placeholder" />)}
      </HorizontalScroll>
    </div>
  </section>;
}
