import { useEffect, useState } from "react";
import config from "../../../config";
import { makeArchiveIdHumanReadable } from "../../../utils/helpers";

export default function useAutocomplete(query) {
  const [{ people, places, provinces, archiveIds }, setSuggestions] = useState({
    people: [],
    places: [],
    provinces: [],
    archiveIds: [],
  });

  const fetchJson = (endpoint, mapFn, signal) =>
    fetch(endpoint, { mode: "cors", signal })
      .then((r) => r.json())
      .then(({ data }) => mapFn(data));

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    if (query.length < 2) {
      controller.abort();
      return setSuggestions({
        people: [],
        places: [],
        provinces: [],
        archiveIds: [],
      });
    }

    const { apiUrl } = config;

    Promise.allSettled([
      fetchJson(`${apiUrl}autocomplete/persons?search=${query}`, (data) =>
        data
          .filter((p) => !/^p\d+$/.test(p.id))
          .map((p) => ({
            value: p.id,
            label: `${p.name}${p.birth_year ? ` (född ${p.birth_year})` : ""}`,
          }))
      ),
      fetchJson(`${apiUrl}autocomplete/socken?search=${query}`, (data) =>
        data.map((p) => ({
          value: p.id,
          label: `${p.name}${p.landskap ? ` (${p.landskap})` : ""}`,
        }))
      ),
      fetchJson(`${apiUrl}autocomplete/landskap?search=${query}`, (data) =>
        data.map((p) => ({
          value: p.name,
          label: p.name,
        }))
      ),
      fetchJson(`${apiUrl}autocomplete/archive_ids?search=${query}`, (data) =>
        data.map((r) => ({
          value: r.id,
          label: makeArchiveIdHumanReadable(r.id),
          secondaryLabel: `(${r.id})`,
        }))
      ),
    ])
      .then((results) => {
        if (signal.aborted) return;
        const [pe, pl, pr, ar] = results.map((r) =>
          r.status === "fulfilled" ? r.value : []
        );
        setSuggestions({ people: pe, places: pl, provinces: pr, archiveIds: ar });
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error(err);
      });
    return () => controller.abort();
  }, [query]);

  return { people, places, provinces, archiveIds };
}