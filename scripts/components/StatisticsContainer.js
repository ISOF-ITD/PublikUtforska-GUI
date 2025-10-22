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
    () => ({ recordtype: "one_record", transcriptionstatus: "published" }),
    []
  );
  const monthRange = "transcriptiondate,now/M,now+2h";

  return (
    <div className="statistics-container">
      <ShortStatistics
        params={{ ...base, range: monthRange }}
        label={`avskrivna uppteckningar i ${monthOrFallback}`}
        shouldFetch={dataChanged}
      />

      <ShortStatistics
        params={{ ...base }}
        label="avskrivna uppteckningar totalt"
        compareAndUpdateStat={compareAndUpdateStat}
      />

      <ShortStatistics
        params={{
          ...base,
          range: monthRange,
          aggregation: "sum,archive.total_pages",
        }}
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
        label={`medskapare som har skrivit av uppteckningar i ${monthOrFallback}`}
        shouldFetch={dataChanged}
      />

      <ShortStatistics
        params={{ ...base, aggregation: "cardinality,transcribedby.keyword" }}
        label="medskapare som har skrivit av uppteckningar totalt"
        shouldFetch={dataChanged}
      />

      <StatisticsList
        params={{ ...base, range: monthRange }}
        type="topTranscribersByPages"
        label={`Topplista transkriberare i ${monthOrFallback}`}
        shouldFetch={dataChanged}
      />

      <StatisticsList
        params={{ ...base }}
        type="topTranscribersByPages"
        label="Topplista transkriberare totalt"
        shouldFetch={dataChanged}
      />
    </div>
  );
}
