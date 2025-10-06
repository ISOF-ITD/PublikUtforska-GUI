import React, { useState, useMemo, useId, useEffect } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import sanitizeHtml from "sanitize-html";

// Helpers

const UPPSALA_BASE = "https://www5.sprakochfolkminnen.se/Realkatalogen/";

const SANITIZE_CFG = {
  allowedTags: ["b", "i", "em", "strong", "a", "br"],
  allowedAttributes: { a: ["href", "target", "rel"] },
};

function formatHeadwords(text = "") {
  // Insert line breaks before "Sida/Sidor" blocks for readability
  return text.trim().replace(/( Sida| Sidor)/g, "\n$1");
}

function toSafeHtml(headwords = "", archiveOrg) {
  let out = formatHeadwords(headwords);

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
  out = out.replace(/\n/g, "<br />");

  return sanitizeHtml(out, SANITIZE_CFG);
}

//Component
export default function HeadwordsElement({ data }) {
  const { headwords = "", archive: { archive_org: archiveOrg } = {} } =
    data || {};
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  if (!headwords) return null;

  const cleanHTML = useMemo(
    () => toSafeHtml(headwords, archiveOrg),
    [headwords, archiveOrg]
  );
  const headwordBadge = useMemo(() => {
    const linkCount = (headwords.match(/\[\[(.+?)\]\]/g) || []).length;
    if (linkCount > 0) return String(linkCount);

    // Rough fallback: number of page refs ("Sida"/"Sidor") or line groups, capped.
    const pageRefs = (headwords.match(/\bSidor?\b/gi) || []).length;
    const rough =
      pageRefs ||
      formatHeadwords(headwords).split(/\n+/).filter(Boolean).length;
    return rough > 25 ? "25+" : String(rough);
  }, [headwords]);

  // persist expanded state per record/section
  const storageKey = `rv:${data?.id || "unknown"}:headwords:expanded`;
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved !== null) setExpanded(saved === "1");
    return () => {}; // no-op
  }, []); // run once

  useEffect(() => {
    sessionStorage.setItem(storageKey, expanded ? "1" : "0");
  }, [expanded, storageKey]);

  return (
    <section className="mb-4">
      <button
        type="button"
        title={expanded ? "Dölj" : "Visa"}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="flex items-center gap-2 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        onClick={() => setExpanded((v) => !v)}
      >
        <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} />
        <span>
          <b>Uppgifter från äldre innehållsregister</b>{" "}
          <span className="text-gray-500">({headwordBadge})</span>
        </span>
      </button>

      <div
        id={contentId}
        className={`mt-2 p-4 shadow-lg rounded-md ${expanded ? "" : "hidden"}`}
        hidden={!expanded}
        aria-hidden={!expanded}
      >
        <div className="rounded-md border border-gray-200">
          <div className="p-3 text-sm leading-relaxed">
            <div
              className="realkatalog-content"
              dangerouslySetInnerHTML={{ __html: cleanHTML }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

HeadwordsElement.propTypes = {
  data: PropTypes.shape({
    headwords: PropTypes.string,
    archive: PropTypes.shape({
      archive_org: PropTypes.string,
    }),
  }).isRequired,
};
