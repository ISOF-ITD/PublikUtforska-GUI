/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import config from "../../../config";
import { l } from "../../../lang/Lang";
import { getTitleText } from "../../../utils/helpers";
import Spinner from "../../Spinner";

function SimilarRecords({ data }) {
  // Normalize id to a stable string so the effect doesn't refire due to type flips.
  const idString = data?.id != null ? String(data.id) : null;

  const [similarRecords, setSimilarRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If id is missing, don’t call the API.
    if (!idString) {
      setSimilarRecords([]);
      setLoading(false);
      setError(null);
      return;
    }

    const ac = new AbortController();

    const fetchSimilarRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        // Safer URL construction with fallback to relative.
        let url = "";
        try {
          url = new URL(
            `similar/${encodeURIComponent(idString)}/`,
            config?.apiUrl
          ).toString();
        } catch {
          const base = String(config?.apiUrl || "");
          const sep = base && !base.endsWith("/") ? "/" : "";
          url = `${base}${sep}similar/${encodeURIComponent(idString)}/`;
        }

        const response = await fetch(url, {
          signal: ac.signal,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          let snippet = "";
          try {
            const text = await response.text();
            snippet = text ? ` – ${text.slice(0, 140)}` : "";
          } catch {
            // ignore
          }
          throw new Error(
            `Failed to fetch similar records: ${response.status} ${response.statusText}${snippet}`
          );
        }

        const result = await response.json();
        const hits = Array.isArray(result?.hits?.hits) ? result.hits.hits : [];

        // Only keep items with media and not the current record itself.
        const seen = new Set([idString]);
        const cleaned = [];

        for (const h of hits) {
          if (!h || h._id == null) continue;

          const hid = String(h._id);
          if (seen.has(hid) || hid === idString) continue;

          const media = h._source?.media;
          if (!Array.isArray(media) || media.length === 0) continue;

          seen.add(hid);
          cleaned.push(h);

          // Cap list size defensively; adjust/remove if your UI expects more.
          if (cleaned.length >= 12) break;
        }

        setSimilarRecords(cleaned);
      } catch (err) {
        if (err?.name !== "AbortError") setError(err.message || String(err));
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    fetchSimilarRecords();
    return () => ac.abort();
  }, [idString]);

  if (loading) {
    return (
      <div
        className="loading mt-8 flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Spinner
          size="lg"
          className="text-isof"
          label={l("Laddar liknande uppteckningar")}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="error mt-8 text-center text-red-700"
        role="alert"
        aria-live="assertive"
      >
        <span className="inline-block rounded-md bg-red-50 px-3 py-2">
          <strong className="mr-1">Error:</strong> {error}
        </span>
      </div>
    );
  }

  if (!similarRecords || similarRecords.length === 0) {
    return null;
  }

  return (
    <section className="mt-8" aria-busy="false">
      <div className="mb-4 flex flex-col items-start justify-between gap-4">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 m-0">
          {l("Liknande uppteckningar")}
        </h3>

        <details className="group max-w-[42rem]">
          <summary
            className="cursor-pointer select-none text-sm text-isof hover:text-darker-isof focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-isof rounded"
            aria-label={l("Visa hjälptext för liknande uppteckningar")}
          >
            {l("Vad är detta?")}
          </summary>

          <div
            className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm flex flex-col gap-2 text-gray-700"
            role="note"
          >
            <p className="font-semibold">
              {l('Hur "Liknande uppteckningar" tas fram')}
            </p>
            <p>
              {l(
                "Liknande uppteckningar genereras genom att analysera innehållet i den valda uppteckningen och identifiera andra uppteckningar med liknande ord och teman."
              )}
            </p>
            <p>
              {l(
                "När en uppteckning visas analyseras dess innehåll noggrant för att identifiera viktiga nyckelord och teman. Dessa identifierade element används sedan för att söka igenom databasen och hitta andra uppteckningar som delar liknande ämnen eller termer. Resultatet är en lista med uppteckningar som är relevanta och relaterade till den ursprungliga uppteckningen, vilket underlättar utforskning av liknande innehåll."
              )}
            </p>
          </div>
        </details>
      </div>

      <ul className="flex flex-wrap gap-4" role="list">
        {similarRecords.map(({ _id, _source }) => {
          const { media, places = [] } = _source || {};
          const firstMedia = Array.isArray(media) ? media[0] : null;
          const titleText = String(getTitleText(_source) || l("(Utan titel)"));

          // Double-check we have a usable image source
          if (!firstMedia?.source) return null;

          let thumbnail = "";
          try {
            thumbnail = new URL(firstMedia.source, config?.imageUrl).toString();
          } catch {
            const base = String(config?.imageUrl || "");
            const sep = base && !base.endsWith("/") ? "/" : "";
            thumbnail = `${base}${sep}${String(firstMedia.source || "")}`;
          }

          const place = places[0];
          const placeName = place
            ? `${place.name}${place.landskap ? `, ${place.landskap}` : ""}`
            : "";

          return (
            <li key={_id} className="w-[150px] text-center list-none">
              <Link
                to={`/records/${encodeURIComponent(String(_id))}`}
                className="block no-underline"
              >
                <img
                  src={thumbnail}
                  alt={titleText || l("Liknande uppteckning")}
                  className="w-full h-auto rounded-lg shadow-sm"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    // Hide a broken image without crashing the component.
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
                <div className="mt-2 text-base text-isof">
                  {titleText}
                  {placeName ? ` (${placeName})` : ""}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

SimilarRecords.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
};

export default SimilarRecords;
