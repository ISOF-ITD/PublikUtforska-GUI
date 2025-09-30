import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
// Optional toasts if you use them elsewhere
import { toastOk, toastError } from "../../../utils/toast";

/**
 * ShareButtons
 * - Copies `text` (or `path`) to clipboard on click.
 * - Optionally renders the text so users can select it.
 */
export default function ShareButtons({
  breakAll = false,
  path = "",
  text,
  title = "",
  hideLink = false,
  className = "",
  onCopied,
}) {
  const [copied, setCopied] = useState(false);
  const clearRef = useRef(null);

  const copyTarget = text ?? path ?? "";

  const copyToClipboard = useCallback(async () => {
    try {
      if (!copyTarget) return;
      // Try async clipboard API first
      await navigator.clipboard.writeText(copyTarget);
      setCopied(true);
      onCopied?.();
      toastOk?.("Kopierat till urklipp");
    } catch {
      // Fallback for older browsers
      try {
        const ta = document.createElement("textarea");
        ta.value = copyTarget;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        onCopied?.();
        toastOk?.("Kopierat till urklipp");
      } catch {
        toastError?.("Kunde inte kopiera");
      }
    }
  }, [copyTarget, onCopied]);

  // Auto-hide the “copied” label
  useEffect(() => {
    if (!copied) return;
    clearRef.current = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(clearRef.current);
  }, [copied]);

  const selectRenderedText = useCallback((e) => {
    // Makes it easy to select the whole string by clicking it
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(e.currentTarget);
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  return (
    <div className={`share-buttons ${className}`}>
      {/* Label */}
      {title ? (
        <div className="mb-1">
          <span className="label font-semibold text-sm text-gray-700">
            {title}
          </span>
        </div>
      ) : null}

      {/* Action + inline text (optional) */}
      <div className="flex flex-col gap-1 justify-between w-full h-full">
        {/* The inline text users can click to select (or hide entirely) */}
        {!hideLink && copyTarget ? (
          <span
            role="textbox"
            aria-readonly="true"
            onClick={selectRenderedText}
            className={`copy-link text-sm text-gray-800 select-text self-start cursor-text ${
              breakAll ? "break-all" : "break-words"
            }`}
            title="Klicka för att markera texten"
          >
            {copyTarget}
          </span>
        ) : null}
        {!hideLink && (
          <button
            type="button"
            onClick={copyToClipboard}
            className="inline-flex items-center self-end gap-2 !mb-0 px-2 py-1 rounded border border-gray-300 hover:border-gray-400
                       text-sm text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Kopiera till urklipp"
          >
            <FontAwesomeIcon icon={faCopy} />
            Kopiera
          </button>
        )}
      </div>

      {/* SR-only status + small inline badge for sighted users */}
      <div aria-live="polite" className="sr-only">
        {copied ? "Kopierat till urklipp" : ""}
      </div>
      {copied && <div className="text-xs text-green-700 -mt-4">Kopierat ✓</div>}
    </div>
  );
}

ShareButtons.propTypes = {
  breakAll: PropTypes.bool,
  path: PropTypes.string,
  text: PropTypes.string,
  title: PropTypes.string,
  hideLink: PropTypes.bool,
  className: PropTypes.string,
  onCopied: PropTypes.func,
};
