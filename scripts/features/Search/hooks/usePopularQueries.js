import { useEffect, useRef, useState } from "react";
import config from "../../../config";

let CACHE = null;

export default function usePopularQueries(suggestionsVisible) {
  const [popularQueries, setPopularQueries] = useState(CACHE ?? []);
  const requested = useRef(false);

  useEffect(() => {
    if (!suggestionsVisible) return;
    if (popularQueries.length) return; // already have data
    if (requested.current) return; // avoid duplicate fetch
    requested.current = true;

    const url = new URL(config.matomoApiUrl);
    Object.entries(config.searchSuggestionsParams).forEach(([k, v]) =>
      url.searchParams.append(k, v)
    );

    fetch(url, { mode: "cors" })
      .then((r) => r.json())
      .then((json) => {
        if (!Array.isArray(json)) return;
        const items = json
          // exclude "start" searches
          .filter((row) => !/^start/i.test(row.label))
          // exclude "person:", "place:" and "archive_id:" prefixed searches
          .filter((row) => !/^(person:|place:|archive_id:)/i.test(row.label))
          .map((row) => ({ value: row.label, label: row.label }));
        CACHE = items;
        setPopularQueries(items);
      })
      .catch((e) => {
        // keep UI resilient; don’t crash suggestions
        // console.error(e)
      });
  }, [suggestionsVisible, popularQueries.length]);

  return popularQueries;
}
