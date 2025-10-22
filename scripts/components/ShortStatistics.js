import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { animated, useSpring } from "@react-spring/web";
import PropTypes from "prop-types";
import config from "../config";
import { l } from "../lang/Lang";

export default function ShortStatistics({
  params,
  label,
  compareAndUpdateStat,
  shouldFetch = false,
}) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(!!compareAndUpdateStat);
  const [error, setError] = useState("");

  const abortRef = useRef(null);
  const inflightRef = useRef(false);

  const displayValue = useMemo(
    () => (typeof value === "number" ? value : 0),
    [value]
  );

  const animatedValue = useSpring({
    from: { number: 0 },
    number: displayValue,
    config: { duration: 1000 },
  });

  const fetchStatistics = useCallback(async () => {
    if (inflightRef.current) return; // avoid overlap
    inflightRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const queryParams = { ...config.requiredParams, ...params };
      const paramString = new URLSearchParams(queryParams).toString();

      const res = await fetch(`${config.apiUrl}count?${paramString}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(l("Fel vid hämtning av statistik"));

      const json = await res.json();
      const v = Number(json?.data?.value ?? 0);
      compareAndUpdateStat?.(v);
      setValue(v);
      setError("");
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message || String(e));
    } finally {
      inflightRef.current = false;
      setLoading(false);
    }
  }, [params, compareAndUpdateStat]);

  // Drive the “total” tile + minute polling when compareAndUpdateStat is provided
  useEffect(() => {
    if (!compareAndUpdateStat) return undefined;
    fetchStatistics();
    const id = setInterval(fetchStatistics, 60_000);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [compareAndUpdateStat, fetchStatistics]);

  // One fetch for dependent tiles when shouldFetch flips true
  useEffect(() => {
    if (!shouldFetch) return;
    fetchStatistics();
  }, [shouldFetch, fetchStatistics]);

  // Abort any in-flight request if the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div className="short-statistics">
      {loading && (
        <div className="loading" role="status" aria-live="polite">
          {l("Hämtar statistik...")}
        </div>
      )}
      {!!error && (
        <div className="error" role="alert" aria-live="polite">
          {l("Fel vid hämtning av statistik")}: {error}
        </div>
      )}
      {!loading && !error && (
        <>
          <animated.div className="value">
            {animatedValue.number.to((num) =>
              Math.floor(num).toLocaleString("sv-SE")
            )}
          </animated.div>
          <div className="label">{label}</div>
        </>
      )}
    </div>
  );
}

ShortStatistics.propTypes = {
  params: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  compareAndUpdateStat: PropTypes.func,
  shouldFetch: PropTypes.bool,
};
