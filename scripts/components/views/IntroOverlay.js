/* eslint-disable react/require-default-props */
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import config from '../../config';
import useDebouncedCallback from '../../features/Search/hooks/useDebouncedCallback';
import useSearchRouting from '../../features/Search/hooks/useSearchRouting';
import useSearchSuggestions from '../../features/Search/hooks/useSearchSuggestions';
import { l } from '../../lang/Lang';
import { getFocusableElements } from '../../utils/focusHelper';
import folkeWhiteLogo from '../../../img/folke-white.svg';
import IsofLogoWhite from '../../../img/logotyp-isof-vit.svg';
import SpråkbankenLogo from '../../../img/logotyp_sprakbanken.svg';

function IntroOverlay({ show = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const introRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const suggestionIdsRef = useRef(new Map());
  const nextSuggestionIdRef = useRef(0);
  const [categories, setCategories] = useState([]);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [suggestionRequest, setSuggestionRequest] = useState(null);
  const { navigateToSearch } = useSearchRouting({
    categories,
    setCategories,
  });
  const debouncedSuggestionChange = useDebouncedCallback(setSuggestionQuery);

  const finishSearch = useCallback((searchTerm, filterUpdate = null) => {
    navigateToSearch(searchTerm, { filterUpdate, resultView: 'list' });
    setSuggestionsVisible(false);
    setSuggestionRequest(null);
    if (onClose) onClose();
  }, [navigateToSearch, onClose]);

  const selectSearchSuggestion = useCallback((searchTerm) => {
    finishSearch(searchTerm);
  }, [finishSearch]);

  const selectFilterSuggestion = useCallback((field, value) => {
    finishSearch('', { field, value });
  }, [finishSearch]);

  const { visibleSuggestionGroups, loading: suggestionsLoading } = useSearchSuggestions({
    query: suggestionQuery,
    suggestionsVisible,
    navigateToSearch: selectSearchSuggestion,
    selectFilter: selectFilterSuggestion,
  });

  const suggestionModel = useMemo(() => {
    const actions = new Map();
    const groups = visibleSuggestionGroups.map((group) => ({
      title: group.title,
      label: group.label,
      field: group.field,
      items: group.items.map((item) => {
        const suggestionKey = JSON.stringify([group.title, item.value]);
        if (!suggestionIdsRef.current.has(suggestionKey)) {
          suggestionIdsRef.current.set(
            suggestionKey,
            String(nextSuggestionIdRef.current),
          );
          nextSuggestionIdRef.current += 1;
        }
        const id = suggestionIdsRef.current.get(suggestionKey);
        actions.set(id, () => group.click(item));

        return {
          id,
          label: item.label,
          secondaryLabel: item.secondaryLabel,
          comment: item.comment,
        };
      }),
    })).filter(({ items }) => items.length > 0);

    return { actions, groups };
  }, [visibleSuggestionGroups]);

  const getInitialSrc = () => {
    const params = new URLSearchParams(location.search);
    const kParam = params.get('k') || config.kontextStartPage;
    return `${config.kontextBasePath}${kParam}`;
  };

  const [iframeSrc] = useState(getInitialSrc);

  const overlayClass = `overlay-container light-modal intro-overlay ${
    show ? 'visible' : ''
  }`;

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        if (event.source !== iframeRef.current?.contentWindow) return;

        if (event.data.type === 'introSearchCapabilityRequest') {
          const requestedVersion = Number(event.data.version);
          const responseVersion = requestedVersion >= 2 ? 2 : 1;
          event.source.postMessage({
            type: 'introSearchCapabilityResponse',
            version: responseVersion,
            supported: true,
            suggestions: responseVersion >= 2,
          }, event.origin);
          return;
        }

        if (event.data.type === 'introSearchSuggestionsRequest') {
          const { requestId, search } = event.data;
          const validRequestId = typeof requestId === 'string'
            || typeof requestId === 'number';
          if (!validRequestId || typeof search !== 'string') return;

          setSuggestionRequest({
            origin: event.origin,
            query: search,
            requestId,
          });
          setSuggestionsVisible(true);
          debouncedSuggestionChange(search);
          return;
        }

        if (event.data.type === 'introSearchSuggestionSelect') {
          const { requestId, suggestionId } = event.data;
          if (
            requestId !== suggestionRequest?.requestId
            || typeof suggestionId !== 'string'
          ) return;

          const selectSuggestion = suggestionModel.actions.get(suggestionId);
          if (selectSuggestion) selectSuggestion();
          return;
        }

        if (event.data.type === 'introSearch') {
          const searchTerm = typeof event.data.search === 'string'
            ? event.data.search.trim()
            : '';
          if (!searchTerm) return;

          finishSearch(searchTerm);
          return;
        }

        if (event.data.type === 'navigateAway') {
          setTimeout(() => {
            if (onClose) onClose();
          }, 100);
        }

        if (event.data.newSrc?.startsWith('http')) {
          const newUrlObject = new URL(event.data.newSrc);
          const newPath = newUrlObject.href.replace(config.kontextBasePath, '');

          const params = new URLSearchParams(location.search);
          if (params.get('k') !== newPath) {
            params.set('k', newPath);
            navigate(`?${params.toString()}`, { replace: true });
          }
        }
      } catch {
        // Ignore malformed postMessage payloads from the embedded content.
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [
    debouncedSuggestionChange,
    finishSearch,
    location.search,
    navigate,
    suggestionModel.actions,
    suggestionRequest?.requestId,
  ]);

  useEffect(() => {
    if (
      !suggestionRequest
      || suggestionRequest.query !== suggestionQuery
      || !suggestionsVisible
    ) return;

    iframeRef.current?.contentWindow?.postMessage({
      type: 'introSearchSuggestionsResponse',
      requestId: suggestionRequest.requestId,
      search: suggestionRequest.query,
      groups: suggestionModel.groups,
      loading: suggestionsLoading,
    }, suggestionRequest.origin);
  }, [
    suggestionModel.groups,
    suggestionQuery,
    suggestionRequest,
    suggestionsLoading,
    suggestionsVisible,
  ]);

  useEffect(() => {
    if (show) return;
    setSuggestionRequest(null);
    setSuggestionsVisible(false);
    setSuggestionQuery('');
  }, [show]);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  useEffect(() => {
    if (!show) return undefined;

    restoreFocusRef.current = document.activeElement;
    const animationFrameId = window.requestAnimationFrame(() => {
      introRef.current?.focus();
    });

    const onDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const root = introRef.current;
      if (!root) return;

      const focusableElements = getFocusableElements(root);
      if (focusableElements.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;
      const activeInsideOverlay = root.contains(active);

      if (event.shiftKey) {
        if (!activeInsideOverlay || active === first || active === root) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!activeInsideOverlay || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      document.removeEventListener('keydown', onDocumentKeyDown);
      window.cancelAnimationFrame(animationFrameId);
      try {
        const restoreTarget = restoreFocusRef.current;
        if (restoreTarget?.isConnected && restoreTarget !== document.body) {
          restoreTarget.focus?.();
          if (document.activeElement === restoreTarget) return;
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput?.focus) {
          searchInput.focus();
        }
      } catch {
        // Ignore focus restoration failures if the previous element is gone.
      }
    };
  }, [show, handleClose]);

  return (
    <div
      className={overlayClass}
      role="dialog"
      aria-modal="true"
    >
      <div className="intro focus:outline-none" ref={introRef} tabIndex={-1}>
        <div className="overlay-header flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-[15px]">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="shrink-0">
              <img
                src={folkeWhiteLogo}
                alt={l('Folkelogga')}
                className="h-12 w-auto max-w-[40vw] object-contain sm:max-w-none"
              />
            </div>
            <span aria-hidden className="h-6 w-px shrink-0 bg-white/30" />
            <a
              href="https://www.isof.se"
              target="_blank"
              rel="noopener noreferrer"
              className="header-keyboard-focus inline-flex min-w-0 items-center rounded-sm"
              aria-label={l('Öppna Institutet för språk och folkminnens webbplats i nytt fönster')}
              title={l('Institutet för språk och folkminnen')}
            >
              <img
                src={IsofLogoWhite}
                alt={l('Institutet för språk och folkminnen')}
                className="h-12 w-auto max-w-[40vw] object-contain sm:max-w-none"
              />
            </a>
          </div>
          <div className="controls ml-auto flex w-auto shrink-0 items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="header-keyboard-focus intro-close-button inline-flex items-center gap-1 rounded-sm bg-transparent p-0 text-white underline [font:inherit]"
              aria-label="Gå vidare"
            >
              Gå vidare
              {' '}
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>

        <div className="content">
          <iframe
            ref={iframeRef}
            id="iframe"
            title="Introduktion och hjälp"
            src={iframeSrc}
            style={{
              border: 'none',
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
}

IntroOverlay.propTypes = {
  show: PropTypes.bool,
  onClose: PropTypes.func,
};

export default IntroOverlay;
