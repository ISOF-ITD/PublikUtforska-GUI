/* eslint-disable react/require-default-props */
import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import config from "../config";
import { l } from "../lang/Lang";

export default function StatisticsList({
  params: rawParams = {},
  label,
  type,
  shouldFetch = false,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false); // show spinner only when fetching
  const [fetchError, setFetchError] = useState("");
  const abortRef = useRef(null);

  const fetchStatistics = useCallback(async () => {
    // Replace any running request with a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setFetchError("");
    try {
      const queryParams = { ...config.requiredParams, ...rawParams };
      const paramString = new URLSearchParams(queryParams).toString();

      let esApiEndpoint;
      switch (type) {
        case "topTranscribersByPages":
          esApiEndpoint = "statistics/get_top_transcribers_by_mediapages/";
          break;
        default:
          throw new Error(`${l("Otillåten typ")}: ${type}`);
      }

      const response = await fetch(
        `${config.apiUrl}${esApiEndpoint}?${paramString}`,
        { signal: controller.signal }
      );
      if (!response.ok) throw new Error(l("Fel vid hämtning av statistik"));

      const json = await response.json();
      setData(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      if (error.name !== "AbortError") {
        setFetchError(error.message || String(error));
      }
    } finally {
      setLoading(false);
    }
  }, [rawParams, type]);

  // Fire when the parent says "fetch now"
  useEffect(() => {
    if (!shouldFetch) return;
    fetchStatistics();
  }, [shouldFetch, fetchStatistics]);

  // Abort on unmount only
  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div>
      {loading && (
        <div className="loading" role="status" aria-live="polite">
          {l("Hämtar statistik...")}
        </div>
      )}

      {!!fetchError && (
        <div className="error" role="alert">
          {l("Fel vid hämtning av statistik")}: {fetchError}
        </div>
      )}

      {!loading && !fetchError && <h3 className="!my-2">{label}</h3>}

      {!loading &&
        !fetchError &&
        (data?.length ? (
          <ol className="space-y-2">
            {data.map((item) => {
              const valueNum = Number(item.value) || 0;
              return (
                <li key={`${item.key}-${item.value}`}>
                  <span className="font-bold">{item.key}</span>:{" "}
                  {valueNum.toLocaleString("sv-SE")}{" "}
                  {valueNum === 1 ? "sida" : "sidor"}
                </li>
              );
            })}
          </ol>
        ) : (
          <span>{l("Ingen data att visa än")}</span>
        ))}
    </div>
  );
}

StatisticsList.propTypes = {
  params: PropTypes.object,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  shouldFetch: PropTypes.bool,
};
