/**
 * Video ustida uzoq bosish / sudrash orqali brauzer menyusi ochilishini bloklaydi.
 * Boshqa komponentlarga tegmasdan faqat index.js orqali ulanadi.
 */

const SHORTS_THUMB_SELECTOR = '.shorts-video-thumb';
const SHIELD_CLASS = 'shorts-video-thumb-shield';

const LONG_PRESS_BLOCK_SELECTORS = [
  '.home-shorts-more',
  '.shorts-modal-movie-head',
  '.shorts-modal-music-head',
  '.shorts-modal-buttons-row .shorts-modal-watch-btn',
  '.shorts-modal-buttons-row .shorts-modal-kino-btn',
].join(',');

function findVideo(target) {
  return target instanceof Element ? target.closest('video') : null;
}

function isLongPressBlockTarget(target) {
  return target instanceof Element && Boolean(target.closest(LONG_PRESS_BLOCK_SELECTORS));
}

function blockNativeMenu(event) {
  if (findVideo(event.target) || isLongPressBlockTarget(event.target)) {
    event.preventDefault();
  }
}

function strengthenVideo(video) {
  if (!video || video.dataset.browserBlockReady === '1') return;
  video.dataset.browserBlockReady = '1';
  video.setAttribute('draggable', 'false');
  video.disablePictureInPicture = true;
  video.setAttribute('controlsList', 'nodownload noremoteplayback');
  video.setAttribute('x-webkit-airplay', 'deny');

  if (video.classList.contains('shorts-video-preview')) {
    video.style.pointerEvents = 'none';
  }
}

function protectShortsVideoThumb(thumb) {
  if (!(thumb instanceof Element) || thumb.dataset.thumbShieldReady === '1') return;
  thumb.dataset.thumbShieldReady = '1';

  if (!thumb.querySelector(`.${SHIELD_CLASS}`)) {
    const shield = document.createElement('div');
    shield.className = SHIELD_CLASS;
    shield.setAttribute('aria-hidden', 'true');
    thumb.appendChild(shield);
  }

  thumb.addEventListener('contextmenu', (event) => event.preventDefault(), true);
}

function protectLongPressBlock(el) {
  if (!(el instanceof Element) || el.dataset.longPressBlockReady === '1') return;
  el.dataset.longPressBlockReady = '1';
  el.addEventListener('contextmenu', (event) => event.preventDefault(), true);
}

function scanVideos(root = document) {
  if (!(root instanceof Element || root instanceof Document)) return;
  root.querySelectorAll?.('video').forEach(strengthenVideo);
}

function scanShortsThumbs(root = document) {
  if (!(root instanceof Element || root instanceof Document)) return;
  root.querySelectorAll?.(SHORTS_THUMB_SELECTOR).forEach(protectShortsVideoThumb);
}

function scanLongPressBlocks(root = document) {
  if (!(root instanceof Element || root instanceof Document)) return;
  root.querySelectorAll?.(LONG_PRESS_BLOCK_SELECTORS).forEach(protectLongPressBlock);
}

function scanAll(root = document) {
  scanVideos(root);
  scanShortsThumbs(root);
  scanLongPressBlocks(root);
}

function initBlockVideoBrowserActions() {
  if (typeof document === 'undefined') return;

  document.addEventListener('contextmenu', blockNativeMenu, true);
  document.addEventListener('dragstart', blockNativeMenu, true);
  document.addEventListener('selectstart', blockNativeMenu, true);

  const runScan = () => scanAll(document);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runScan, { once: true });
  } else {
    runScan();
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach((node) => {
        if (node instanceof HTMLVideoElement) {
          strengthenVideo(node);
          return;
        }
        if (node instanceof Element) scanAll(node);
      });
    });
  });

  const startObserver = () => {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.body) startObserver();
  else document.addEventListener('DOMContentLoaded', startObserver, { once: true });
}

initBlockVideoBrowserActions();
