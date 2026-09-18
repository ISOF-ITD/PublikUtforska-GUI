import {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faClose } from '@fortawesome/free-solid-svg-icons';
import config from '../../../config';
import PdfViewer from '../../../components/PdfViewer';
import ModalDialog, { ModalDialogTitle } from '../../../components/ModalDialog';

export default function ImageOverlay() {
  const [imageUrl, setImageUrl] = useState(null);
  const [type, setType] = useState(null); // 'image' | 'pdf'
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaList, setMediaList] = useState([]);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Refs for dialog controls and touch management
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchActive = useRef(false);

  // Derived helpers
  const total = mediaList?.length ?? 0;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < total - 1;
  const current = mediaList?.[currentIndex] ?? {};

  const altText = useMemo(
    () => current?.text?.trim()
      || current?.title?.trim()
      || current?.comment?.trim()
      || 'Arkivbild',
    [current],
  );

  const closeOverlay = useCallback(() => {
    setVisible(false);
  }, []);

  const showAtIndex = useCallback(
    (nextIndex) => {
      if (!mediaList?.length) return;
      const bounded = Math.max(0, Math.min(nextIndex, mediaList.length - 1));
      const nextMediaItem = mediaList[bounded];
      setCurrentIndex(bounded);
      setImageUrl(nextMediaItem?.source ?? null);
      setType(nextMediaItem?.type ?? null);
      setHasError(false);
      setIsLoading(true);
    },
    [mediaList],
  );

  const showNext = useCallback(() => {
    if (!hasNext) return;
    showAtIndex(currentIndex + 1);
  }, [currentIndex, hasNext, showAtIndex]);

  const showPrev = useCallback(() => {
    if (!hasPrev) return;
    showAtIndex(currentIndex - 1);
  }, [currentIndex, hasPrev, showAtIndex]);

  // Event bus wiring – stable subscription
  useEffect(() => {
    const viewImageHandler = (event) => {
      const payload = event?.detail ?? event?.target ?? {};
      const {
        imageUrl: newImageUrl,
        type: newType,
        mediaList: newMediaList = [],
        currentIndex: newCurrentIndex = 0,
      } = payload;

      setMediaList(Array.isArray(newMediaList) ? newMediaList : []);
      setCurrentIndex(Number.isFinite(newCurrentIndex) ? newCurrentIndex : 0);
      setImageUrl(newImageUrl ?? null);
      setType(newType ?? null);
      setHasError(false);
      setIsLoading(true);
      setVisible(true);
    };

    const hideHandler = () => setVisible(false);

    const eb = typeof window !== 'undefined' ? window.eventBus : null;
    eb?.addEventListener('overlay.viewimage', viewImageHandler);
    eb?.addEventListener('overlay.hide', hideHandler);

    return () => {
      eb?.removeEventListener('overlay.viewimage', viewImageHandler);
      eb?.removeEventListener('overlay.hide', hideHandler);
    };
  }, []);

  // Preload neighbors for smoother nav
  useEffect(() => {
    if (!mediaList?.length) return;
    const next = mediaList[currentIndex + 1];
    const prev = mediaList[currentIndex - 1];
    [next, prev]
      .filter(Boolean)
      .filter((m) => m.type === 'image' && m.source)
      .forEach((m) => {
        const img = new Image();
        img.src = (config.imageUrl || '') + m.source;
      });
  }, [currentIndex, mediaList]);

  // Touch swipe (left/right)
  const onTouchStart = useCallback((e) => {
    if (e.touches?.length !== 1) {
      touchActive.current = false;
      return;
    }
    const t = e.touches?.[0];
    if (!t) return;
    touchActive.current = true;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  }, []);

  const onTouchEnd = useCallback((e) => {
    const t = e.changedTouches?.[0];
    if (!touchActive.current || !t || touchStartX.current == null) return;
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    const threshold = 40; // px
    if (Math.abs(dx) > threshold && Math.abs(dy) < threshold) {
      if (dx < 0) showNext(); else showPrev();
    }
    touchActive.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
  }, [showNext, showPrev]);

  const onTouchCancel = useCallback(() => {
    touchActive.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
  }, []);

  // When we change the src, show a loader until onLoad/onError fires
  useEffect(() => {
    if (!imageUrl) return;
    setHasError(false);
    setIsLoading(true);
  }, [imageUrl, type, reloadKey]);

  useEffect(() => {
    if (!visible) return undefined;

    const onDocumentKeyDown = (e) => {
      if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        showPrev();
        return;
      }

      if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        showNext();
      }
    };

    document.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [visible, showPrev, showNext]);

  return (
    <ModalDialog
      open={visible}
      onClose={closeOverlay}
      initialFocus={closeButtonRef}
      initialFocusIndicatorClassName="modal-initial-focus-visible modal-initial-focus-visible--on-dark"
      closeOnBackdrop
      containerClassName="fixed inset-0 z-[3000] bg-neutral-900/80 supports-[backdrop-filter]:bg-black/65 supports-[backdrop-filter]:backdrop-blur-sm"
    >
      <ModalDialogTitle className="sr-only">
        {`Bildvisning: ${currentIndex + 1} / ${total}`}
      </ModalDialogTitle>

      {/* Close button */}
      <button
        ref={closeButtonRef}
        title="Stäng"
        aria-label="Stäng overlay"
        type="button"
        onClick={closeOverlay}
        className="fixed top-4 right-4 md:top-6 md:right-8 inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-black/45 !text-white text-2xl leading-none hover:bg-black/60 focus:outline-none focus-visible:bg-black/70 focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/80"
      >
        <span aria-hidden>
          <FontAwesomeIcon icon={faClose} />
        </span>
      </button>

      {/* Centered content area */}
      <div className="min-h-full w-full grid place-items-center p-4 sm:p-6 md:p-10">
        <div
          ref={dialogRef}
          tabIndex={-1}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          className="relative max-w-[95vw] max-h-[92vh] outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-xl"
        >
          {/* IMAGE */}
          {imageUrl && type === 'image' && (
            <div className="relative">
              <img
                key={`img-${imageUrl}-${reloadKey}`}
                className="block max-w-[90vw] md:max-w-[80vw] max-h-[82vh] rounded-xl shadow-2xl object-contain bg-black/10"
                src={(config.imageUrl || '') + imageUrl}
                alt={altText}
                loading="eager"
                decoding="async"
                onLoad={() => setIsLoading(false)}
                onError={() => { setHasError(true); setIsLoading(false); }}
                draggable={false}
              />
              {isLoading && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/40 border-t-transparent" aria-label="Laddar" />
                </div>
              )}
              {hasError && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="mx-4 max-w-[70ch] rounded-lg bg-black/70 p-4 !text-white shadow-lg">
                    <p className="font-medium">Kunde inte ladda bilden.</p>
                    <div className="mt-2 flex gap-3">
                      <button
                        type="button"
                        className="rounded-md bg-white/15 px-3 py-1 text-sm hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        onClick={() => setReloadKey((n) => n + 1)}
                      >
                        Försök igen
                      </button>
                      <a
                        href={(config.imageUrl || '') + imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-white/15 px-3 py-1 text-sm hover:bg-white/25"
                      >
                        Öppna i ny flik
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF */}
          {imageUrl && type === 'pdf' && (
            <div className="relative w-[92vw] md:w-[90vw] max-w-[1000px] h-[82vh] bg-white rounded-xl shadow-2xl overflow-hidden">
              <PdfViewer url={(config.pdfUrl || config.imageUrl || '') + imageUrl} height="100%" />
            </div>
          )}

          {/* Prev/Next controls (optional) */}
          {!!total && total > 1 && (
            <>
              <button
                type="button"
                onClick={showPrev}
                aria-label="Föregående bild"
                disabled={!hasPrev}
                className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-black/50 !text-white text-2xl hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 ${!hasPrev ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span aria-hidden>
                  <FontAwesomeIcon icon={faChevronLeft} />
                </span>
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Nästa bild"
                disabled={!hasNext}
                className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-black/50 !text-white text-2xl hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 ${!hasNext ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span aria-hidden>
                  <FontAwesomeIcon icon={faChevronRight} />
                </span>
              </button>

              {/* Index indicator + caption */}
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-sm !text-white shadow-md">
                <span className="font-medium">
                  {currentIndex + 1}
                  {' '}
                  /
                  {' '}
                  {total}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live region for SR to announce slide changes */}
      <div className="sr-only" aria-live="polite">{`Bild ${currentIndex + 1} av ${total}`}</div>
    </ModalDialog>
  );
}
