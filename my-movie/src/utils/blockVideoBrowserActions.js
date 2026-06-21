/**
 * Video ustida uzoq bosish / sudrash orqali brauzer menyusi ochilishini bloklaydi.
 * Boshqa komponentlarga tegmasdan faqat index.js orqali ulanadi.
 */

function findVideo(target) {
  return target instanceof Element ? target.closest('video') : null;
}

function blockNativeMenu(event) {
  if (findVideo(event.target)) {
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
}

function scanVideos(root = document) {
  if (!(root instanceof Element || root instanceof Document)) return;
  root.querySelectorAll?.('video').forEach(strengthenVideo);
}

function initBlockVideoBrowserActions() {
  if (typeof document === 'undefined') return;

  document.addEventListener('contextmenu', blockNativeMenu, true);
  document.addEventListener('dragstart', blockNativeMenu, true);
  document.addEventListener('selectstart', blockNativeMenu, true);

  const runScan = () => scanVideos(document);

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
        if (node instanceof Element) scanVideos(node);
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
