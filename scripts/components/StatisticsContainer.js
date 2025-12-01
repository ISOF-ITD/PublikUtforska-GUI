import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ShortStatistics from "./ShortStatistics";
import StatisticsList from "./StatisticsList";
import config from "../config";
import { l } from "../lang/Lang";

export default function StatisticsContainer() {
  const firstStatValueRef = useRef(null);
  const [dataChanged, setDataChanged] = useState(false);
  const [currentMonth, setCurrentMonth] = useState("");

  const compareAndUpdateStat = useCallback((newValue) => {
    const v = Number(newValue ?? 0);
    if (firstStatValueRef.current !== v) {
      firstStatValueRef.current = v;
      setDataChanged(true);
    }
  }, []);

  // let children do one fetch per trigger
  useEffect(() => {
    if (dataChanged) setDataChanged(false);
  }, [dataChanged]);

  useEffect(() => {
    // trigger one fetch for dependents on first mount
    setDataChanged(true);
  }, []);

  // fetch server month once, and refresh at the top of each hour
  useEffect(() => {
    let intervalId;
    const controller = new AbortController();

    const loadCurrentMonth = async () => {
      try {
        const res = await fetch(`${config.apiUrl}current_time`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("current_time fetch failed");
        const json = await res.json();
        const month = new Date(json.data).toLocaleString("sv-SE", {
          month: "long",
        });
        setCurrentMonth(month);
      } catch (e) {
        if (e.name !== "AbortError") {
          // local fallback
          setCurrentMonth(
            new Date().toLocaleString("sv-SE", { month: "long" })
          );
        }
      }
    };

    loadCurrentMonth();
    // keep the label in sync across month rollovers
    intervalId = setInterval(loadCurrentMonth, 60 * 60 * 1000);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, []);

  const monthOrFallback = currentMonth || l("denna månad");

  // memoize param objects to avoid needless re-renders
  const base = useMemo(
    () => ({ transcriptionstatus: "published" }),
    []
  );
  const monthRange = "transcriptiondate,now/M,now+2h";

  const pTotals = base;
  const pMonthRecords = useMemo(() => ({ ...base, range: monthRange }), [base]);
  const pMonthPages = useMemo(
    () => ({
      ...base,
      range: monthRange,
      aggregation: "sum,archive.total_pages",
    }),
    [base]
  );

  return (
    <div className="flex flex-col gap-4">
      <ShortStatistics
        params={pMonthPages}
        label={`avskrivna sidor i ${monthOrFallback}`}
        shouldFetch={dataChanged}
      />

      <ShortStatistics
        params={{ ...base, aggregation: "sum,archive.total_pages" }}
        label="avskrivna sidor totalt"
        shouldFetch={dataChanged}
      />

      <ShortStatistics
        params={{
          ...base,
          range: monthRange,
          aggregation: "cardinality,transcribedby.keyword",
        }}
        label={`bidragsgivare i ${monthOrFallback}`}
        shouldFetch={dataChanged}
      />

      <ShortStatistics
        params={{ ...base, aggregation: "cardinality,transcribedby.keyword" }}
        label="bidragsgivare totalt"
        shouldFetch={dataChanged}
      />

      <StatisticsList
        params={{ ...base, range: monthRange }}
        type="topTranscribersByPages"
        label={`Topplista bidragsgivare i ${monthOrFallback}`}
        shouldFetch={dataChanged}
      />

      <StatisticsList
        params={{ ...base }}
        type="topTranscribersByPages"
        label="Topplista bidragsgivare totalt"
        shouldFetch={dataChanged}
      />
    </div>
  );
}
