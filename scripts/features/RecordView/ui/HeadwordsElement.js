import {
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import sanitizeHtml from "sanitize-html";
import highlightCompleteHtml from '../utils/highlightCompleteHtml';

// Helpers

const UPPSALA_BASE = "https://www5.sprakochfolkminnen.se/Realkatalogen/";

const SANITIZE_CFG = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'br', 'span'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    span: ['class'],
  },
  allowedClasses: {
    span: ['highlight'],
  },
};

function formatHeadwords(text) {
  // Ensure we always operate on a string
  const s = (text ?? "").toString().trim();
  // Insert line breaks before "Sida/Sidor" blocks for readability
  return s.replace(/( Sida| Sidor)/g, '\n$1');
}

function toSafeHtml(headwords, archiveOrg) {
  let out = formatHeadwords(headwords ?? "");

  // Just nu är kontroll på arkiv egentligen onödig, då bara Uppsala har länkar, 
  // markerade med [[]], till publika inskannande kort
  if (archiveOrg === "Uppsala") {
    // Transform [[path]] → <a href="...">Visa indexkort</a> (safer single-pass regex)
    out = out.replace(
      /\[\[(.+?)\]\]/g,
      (_m, path) =>
        `<a href="${UPPSALA_BASE}${path}" target="_blank" rel="noopener noreferrer">Visa indexkort</a>`
    );
  } else {
    // Neutralize any accidental [[...]] markers while keeping the text
    out = out.replace(/\[\[(.+?)\]\]/g, "($1)");
  }

  // Om arkivet inte är 'Uppsala', returnera den formaterade strängen oförändrad
  // Preserve newlines when injecting as HTML
  out = (out ?? "").replace(/\n/g, "<br />");
  return sanitizeHtml(out, SANITIZE_CFG);
}

//Component
export default function HeadwordsElement({ data, highlightHtml = '' }) {
  const archiveOrg = data?.archive?.archive_org;
  const safeHeadwords = data?.headwords ?? "";
  const hasHighlight = Boolean(highlightHtml?.length);
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  const cleanHTML = useMemo(
    () => highlightCompleteHtml(toSafeHtml(safeHeadwords, archiveOrg), highlightHtml),
    [safeHeadwords, archiveOrg, highlightHtml],
  );
  const headwordBadge = useMemo(() => {
    const linkCount = (safeHeadwords.match(/\[\[(.+?)\]\]/g) || []).length;
    if (linkCount > 0) return String(linkCount);

    // Rough fallback: number of page refs ("Sida"/"Sidor") or line groups, capped.
    const pageRefs = (safeHeadwords.match(/\bSidor?\b/gi) || []).length;
    const rough =
      pageRefs ||
      formatHeadwords(safeHeadwords).split(/\n+/).filter(Boolean).length;
    return rough > 25 ? "25+" : String(rough);
  }, [safeHeadwords]);

  // persist expanded state per record/section
  const storageKey = `rv:${data?.id || "unknown"}:headwords:expanded`;
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (hasHighlight) setExpanded(true);
    else if (saved !== null) setExpanded(saved === "1");
    return () => {}; // no-op
  }, [hasHighlight, storageKey]);

  useEffect(() => {
    sessionStorage.setItem(storageKey, expanded ? "1" : "0");
  }, [expanded, storageKey]);

  if (!safeHeadwords) return null;

  return (
    <div className="min-w-0">
      <dt id={`${contentId}-label`} className="!m-0 text-sm font-semibold text-muted">
        <button
          type="button"
          title={expanded ? "Dölj" : "Visa"}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="!m-0 !flex !h-auto min-h-11 w-full items-center justify-start gap-3 !rounded-none !border-0 !bg-transparent !p-0 !text-left !text-sm !font-semibold !text-muted !leading-normal ![font-family:inherit] !whitespace-normal !normal-case !tracking-normal hover:!text-link hover:underline focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="min-w-0 break-words">
            Uppgifter från äldre innehållsregister{" "}
            <span className="text-subtle">({headwordBadge})</span>
          </span>
          <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} aria-hidden="true" focusable="false" className="w-3 shrink-0" />
        </button>
      </dt>

      <dd
        id={contentId}
        className="m-0 pt-2 pb-2 min-[650px]:ml-[10.5rem]"
        hidden={!expanded}
        aria-hidden={!expanded}
      >
        <div className="text-body">
          <div className="text-sm leading-relaxed">
            <div
              dangerouslySetInnerHTML={{ __html: cleanHTML }}
            />
          </div>
        </div>
      </dd>
    </div>
  );
}

HeadwordsElement.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    headwords: PropTypes.string,
    safeHeadwords: PropTypes.string,
    archive: PropTypes.shape({
      archive_org: PropTypes.string,
    }),
  }).isRequired,
  highlightHtml: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
};
