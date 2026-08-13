import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import TrillerInfoModal from './TrillerInfoModal';
import './TrillerDescription.css';

const MOBILE_MAX = 900;

const pickDescription = (description, lang) => {
  if (!description || typeof description !== 'object') return null;
  const local = description[lang] || description.uz || description.ru;
  if (!local || typeof local !== 'object') return null;
  const text = local.text != null ? String(local.text).trim() : '';
  const year = local.year != null ? String(local.year).trim() : '';
  const country = local.country != null ? String(local.country).trim() : '';
  const genre = local.genre != null ? String(local.genre).trim() : '';
  if (!text && !year && !country && !genre) return null;
  return { text, year, country, genre };
};

/**
 * Desktop: 4 qator; «Ko‘proq» → text + yil/davlat/janr expand.
 * Mobile: 2 qator; «Ko‘proq» → modal (text + specs).
 */
const TrillerDescription = ({ description, className = '', loading = false }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX
  );
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const data = useMemo(
    () => pickDescription(description, contentLang),
    [description, contentLang]
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setExpanded(false);
    setModalOpen(false);
  }, [description, contentLang]);

  if (loading) {
    return (
      <div
        className={`triller-description${className ? ` ${className}` : ''}`}
        aria-hidden="true"
      >
        <div className="triller-description-text-wrap">
          <SkeletonLoader variant="triller-description-text" />
          <SkeletonLoader variant="triller-description-more" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const rows = [
    { key: 'year', label: t('triller.infoYear', 'Yil'), value: data.year },
    { key: 'country', label: t('triller.infoCountry', 'Davlat'), value: data.country },
    { key: 'genre', label: t('triller.infoGenre', 'Janr'), value: data.genre },
  ].filter((row) => row.value);

  const showSpecs = !isMobile && expanded && rows.length > 0;

  const handleMore = () => {
    if (isMobile) {
      setModalOpen(true);
      return;
    }
    setExpanded((v) => !v);
  };

  const moreLabel = isMobile
    ? t('triller.showMore', "Ko'proq ko'rsatish")
    : expanded
      ? t('triller.showLess', "Kamroq ko'rsatish")
      : t('triller.showMore', "Ko'proq ko'rsatish");

  // Desktop expand: tugma specsdan keyin; aks holda text ostida
  const moreAfterSpecs = !isMobile && expanded;
  const moreAfterText = !moreAfterSpecs;

  return (
    <div className={`triller-description${className ? ` ${className}` : ''}`}>
      {data.text ? (
        <div className="triller-description-text-wrap">
          <p
            className={`triller-description-text${
              expanded ? ' is-expanded' : ''
            }${isMobile ? ' is-mobile' : ' is-desktop'}`}
          >
            {data.text}
          </p>
          {moreAfterText ? (
            <button type="button" className="triller-description-more" onClick={handleMore}>
              {moreLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      {showSpecs ? (
        <dl
          className={`triller-info-specs triller-description-specs${
            expanded ? ' is-open' : ''
          }`}
        >
          {rows.map((row) => (
            <div className="triller-info-spec-row" key={row.key}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {moreAfterSpecs ? (
        <button
          type="button"
          className="triller-description-more triller-description-more--after-specs"
          onClick={handleMore}
        >
          {moreLabel}
        </button>
      ) : null}

      <TrillerInfoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        description={data}
      />
    </div>
  );
};

export default TrillerDescription;
