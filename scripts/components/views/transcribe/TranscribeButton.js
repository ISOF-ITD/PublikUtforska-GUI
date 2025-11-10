/* eslint-disable react/require-default-props */
import classNames from "classnames";
import PropTypes from "prop-types";
import { useCallback, useMemo, useState, useId } from "react";
import config from "../../../config";
import { getPlaceString } from "../../../utils/helpers";

// The TranscribeButton component is a functional component that, when clicked, dispatches
// a 'overlay.transcribe' event via the global eventBus object. The event data contains
// details about the current record.
// The component can take in several props to customize its appearance and behavior.
export default function TranscribeButton({
  random = false,
  recordId = "",
  archiveId = "",
  title = "",
  type = "",
  images = [],
  transcriptionType = "",
  places = [],
  className = "",
  onClick,
  label,
  helptext = null,
  transcribeCancel,
  disabled = false,
  variant = "primary",
}) {
  const [busy, setBusy] = useState(false);

  const autoId = useId();
  const helpTextId = helptext ? `transcribe-help-${autoId}` : undefined;

  const dispatchOverlay = useCallback((payload, eventName) => {
    if (typeof window !== "undefined" && window.eventBus) {
      window.eventBus.dispatch(eventName, payload);
    } else {
      // Keep silent in UI; useful for debugging non-browser contexts.
      // eslint-disable-next-line no-console
      console.warn("eventBus is not available on window.");
    }
  }, []);

  const buildPayload = useCallback(
    (opts) => ({
      url: `${config.siteUrl}/records/${opts.id}`,
      id: String(opts.id ?? ""),
      archiveId: opts.archiveId ?? "",
      title: opts.title ?? "",
      type: opts.type ?? "", // record type (domain term), not the <button type>
      images: Array.isArray(opts.images) ? opts.images : [],
      transcriptionType: opts.transcriptionType ?? "",
      placeString: getPlaceString(opts.places || []),
      random: !!opts.random,
    }),
    []
  );

  const eventFor = () => "overlay.transcribePageByPage";

  const startTranscription = useCallback(
    (opts) => {
      const payload = buildPayload(opts);
      dispatchOverlay(payload, eventFor(opts.transcriptionType));
    },
    [buildPayload, dispatchOverlay, eventFor]
  );

  const fetchRandomAndStart = useCallback(async () => {
    try {
      setBusy(true);

      // Build a robust URL regardless of how specialEventTranscriptionCategory is formatted.
      const url = new URL(`${config.apiUrl}random_document/`);
      const params = new URLSearchParams({
        type: "arkiv",
        recordtype: "one_record",
        transcriptionstatus: "readytotranscribe",
        categorytypes: "tradark",
        publishstatus: "published",
      });

      const extra = (config.specialEventTranscriptionCategory || "")
        .toString()
        .replace(/^[&?]/, "")
        .split("&")
        .filter(Boolean);

      for (const kv of extra) {
        const [k, v = ""] = kv.split("=");
        if (k) params.append(k, v);
      }

      url.search = params.toString();

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      const hit = json?.hits?.hits?.[0]?._source;

      if (!hit) {
        // eslint-disable-next-line no-console
        console.warn("No random document found.");
        return;
      }

      startTranscription({
        id: hit.id,
        archiveId: hit?.archive?.archive_id,
        title: hit?.title,
        type: hit?.type ?? hit?.recordtype,
        images: hit?.media,
        transcriptionType: hit?.transcriptiontype,
        places: hit?.places,
        random: true,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching random document:", error);
    } finally {
      setBusy(false);
    }
  }, [startTranscription]);

  const defaultOnClick = useCallback(() => {
    if (typeof transcribeCancel === "function") {
      transcribeCancel();
    }
    if (random) {
      if (!busy) fetchRandomAndStart();
      return;
    }
    startTranscription({
      id: recordId,
      archiveId,
      title,
      type,
      images,
      transcriptionType,
      places,
      random: false,
    });
  }, [
    archiveId,
    busy,
    fetchRandomAndStart,
    images,
    places,
    random,
    recordId,
    startTranscription,
    title,
    transcriptionType,
    type,
    transcribeCancel,
  ]);

  const effectiveOnClick = onClick || defaultOnClick;

  if (!config.activateTranscription) {
    // Ingen knapp
    return null;
  }
  // else visa knapp
  const isDisabled = disabled || busy;

  return (
    <div className="m-0 p-0 w-full">
      {helptext && <div id={helpTextId}>{helptext}</div>}
      <button
        className={classNames(
          // base
          "flex items-center justify-center gap-2 h-10 !p-3 !text-base leading-normal tracking-normal border border-solid",
          "no-underline cursor-pointer mb-4 print:hidden transition-opacity duration-500",
          // variants
          variant === "primary" && "border-white !text-white",
          variant === "listLike" &&
            "w-full rounded-md bg-white px-3 py-2 font-medium text-gray-700 shadow hover:bg-gray-50 border-transparent",
          // custom extra classes last
          className
        )}
        onClick={effectiveOnClick}
        type="button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-describedby={helpTextId}
        data-random={random ? "true" : "false"}
        data-busy={busy ? "true" : "false"}
        title={typeof label === "string" ? label : undefined}
      >
        {label}
      </button>
    </div>
  );
}

TranscribeButton.propTypes = {
  random: PropTypes.bool,
  recordId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  archiveId: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string, // domain "record type", not <button type>
  images: PropTypes.arrayOf(PropTypes.object),
  transcriptionType: PropTypes.string,
  places: PropTypes.arrayOf(PropTypes.object),
  className: PropTypes.string,
  onClick: PropTypes.func,
  label: PropTypes.node,
  helptext: PropTypes.node,
  transcribeCancel: PropTypes.func,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(["primary", "listLike"]),
};
