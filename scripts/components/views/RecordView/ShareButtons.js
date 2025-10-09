import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { toastOk, toastError } from "../../../utils/toast";

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
  const [announceTick, setAnnounceTick] = useState(0); // force live region updates
  const timerRef = useRef(null);
  const idRef = useRef(`share-${Math.random().toString(36).slice(2)}`);

  const copyTarget = useMemo(() => text ?? path ?? "", [text, path]);
  const hasTarget = Boolean(copyTarget && copyTarget.length);

  const doSuccess = useCallback(() => {
    setCopied(true);
    setAnnounceTick((n) => n + 1);
    onCopied?.();
    toastOk?.("Kopierat till urklipp");
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  }, [onCopied]);

  const copyToClipboard = useCallback(async () => {
    if (!hasTarget) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyTarget);
        doSuccess();
        return;
      }
      throw new Error("No async clipboard");
    } catch {
      // Fallback for older browsers / insecure contexts
      try {
        const ta = document.createElement("textarea");
        ta.value = copyTarget;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand?.("copy");
        document.body.removeChild(ta);
        doSuccess();
      } catch {
        toastError?.("Kunde inte kopiera");
      }
    }
  }, [copyTarget, hasTarget, doSuccess]);

  // Select the text when focusing/clicking the field
  const selectRenderedText = useCallback((e) => {
    e.currentTarget.select?.();
  }, []);

  // Keyboard: Enter to copy when focus is in the field
  const onFieldKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        copyToClipboard();
      }
    },
    [copyToClipboard]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const titleId = `${idRef.current}-title`;
  const statusId = `${idRef.current}-status`;
  const helpId = `${idRef.current}-help`;

  return (
    <section
      className={`mt-6 rounded border border-solid border-gray-300 px-3 bg-white ${className}`}
      aria-labelledby={title ? titleId : undefined}
    >
      {title ? (
        <h3 id={titleId} className="mb-2 font-semibold text-sm text-gray-700">
          {title}
        </h3>
      ) : null}

      <div className="flex flex-col gap-2">
        {!hideLink && hasTarget ? (
          <textarea
            id={`${idRef.current}-field`}
            readOnly
            rows={Math.min(4, Math.max(1, Math.ceil(copyTarget.length / 80)))}
            value={copyTarget}
            onFocus={selectRenderedText}
            onClick={selectRenderedText}
            onKeyDown={onFieldKeyDown}
            aria-readonly="true"
            aria-describedby={`${helpId} ${statusId}`}
            className={`w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-800 resize-none ${
              breakAll ? "break-all" : "break-words"
            }`}
            title="Klicka eller fokusera för att markera texten"
            
          />
        ) : null}

        <div className="flex items-center justify-between">
          <output
            id={statusId}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`text-xs transition-opacity ${
              copied ? "opacity-100 text-green-700" : "opacity-0"
            }`}
          >
            {/* Changing the text node ensures SR announce on repeat copies */}
            {copied ? `Kopierat ✓` : ""}
          </output>

          <button
            type="button"
            onClick={copyToClipboard}
            disabled={!hasTarget}
            className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-sm transition-colors
              ${
                hasTarget
                  ? "border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            aria-label={hasTarget ? "Kopiera till urklipp" : "Inget att kopiera"}
            aria-describedby={helpId}
            title={hasTarget ? "Kopiera till urklipp" : "Inget att kopiera"}
          >
            <FontAwesomeIcon icon={faCopy} />
            Kopiera
          </button>
        </div>

        {/* Visually hidden helper */}
        <p id={helpId} className="sr-only">
          Klicka i fältet för att markera texten, eller använd knappen för att kopiera.
        </p>
      </div>
    </section>
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
