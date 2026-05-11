import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import config from "../../../config";
import { l } from "../../../lang/Lang";
import Spinner from "../../../components/Spinner";
import RecordCards from '../../RecordList/ui/RecordCards';

function normalizeSimilarRecord(hit) {
  const { _id: fallbackId, _source: source = {} } = hit || {};
  const id = source.id != null ? source.id : fallbackId;

  return {
    ...hit,
    _source: {
      ...source,
      id,
    },
  };
}

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
        const cleaned = hits.reduce((records, hit) => {
          const { _id: hitId, _source: source = {} } = hit || {};
          const hid = hitId == null ? null : String(hitId);
          const { media } = source;

          if (
            records.length >= 12
            || !hid
            || seen.has(hid)
            || hid === idString
            || !Array.isArray(media)
            || media.length === 0
          ) {
            return records;
          }

          seen.add(hid);
          return records.concat(hit);
        }, []);

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
          className="text-link"
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
          <strong className="mr-1">Error:</strong>
          {' '}
          {error}
        </span>
      </div>
    );
  }

  if (!similarRecords || similarRecords.length === 0) {
    return null;
  }

  const normalizedRecords = similarRecords.map(normalizeSimilarRecord);

  return (
    <section className="mt-8" aria-busy="false">
      <div className="mb-4 flex flex-col items-start justify-between gap-4">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-body m-0">
          {l('Liknande accessioner')}
        </h3>

        <details className="group max-w-[42rem]">
          <summary
            className="cursor-pointer select-none text-sm text-link hover:text-link-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus rounded"
            aria-label={l("Visa hjälptext för liknande accessioner")}
          >
            {l("Vad är detta?")}
          </summary>

          <div
            className="mt-2 rounded-md border border-border bg-surface-muted p-3 text-sm flex flex-col gap-2 text-body"
            role="note"
          >
            <p className="font-semibold">
              {l('Hur "Liknande accessioner" tas fram')}
            </p>
            <p>
              {l(
                "Liknande accessioner genereras genom att analysera innehållet i den valda accessionen och identifiera andra accessioner med liknande ord och teman."
              )}
            </p>
            <p>
              {l(
                "När en accession visas analyseras dess innehåll noggrant för att identifiera viktiga nyckelord och teman. Dessa identifierade element används sedan för att söka igenom databasen och hitta andra accessioner som delar liknande ämnen eller termer. Resultatet är en lista med uppteckningar som är relevanta och relaterade till den ursprungliga uppteckningen, vilket underlättar utforskning av liknande innehåll."
              )}
            </p>
          </div>
        </details>
      </div>

      <RecordCards
        records={normalizedRecords}
        params={{}}
        mode="material"
        layout="desktop-grid"
      />
    </section>
  );
}

SimilarRecords.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
};

export default SimilarRecords;
