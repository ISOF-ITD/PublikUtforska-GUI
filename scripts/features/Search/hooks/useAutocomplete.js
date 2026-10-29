import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import config from '../../../config';
import { buildCollectionApiParams } from '../../../utils/collectionHelper';

const EMPTY_SUGGESTIONS = {
  people: [], places: [], provinces: [], archiveIds: [],
};

async function fetchSuggestions(endpoint, map, signal) {
  const response = await fetch(endpoint, { mode: 'cors', signal });
  if (!response.ok) throw new Error('Kunde inte hämta sökförslag.');
  const { data } = await response.json();
  return map(data);
}

export default function useAutocomplete(query) {
  const location = useLocation();
  const theme = new URLSearchParams(location.search).get('theme') || '';
  const [suggestions, setSuggestions] = useState({
    ...EMPTY_SUGGESTIONS, sourceQuery: '', sourceTheme: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    if (query.length < 2) return () => controller.abort();

    const queryParams = new URLSearchParams(buildCollectionApiParams({
      theme, search: query,
    })).toString();
    const { apiUrl } = config;
    Promise.allSettled([
      fetchSuggestions(`${apiUrl}autocomplete/persons/?${queryParams}&count=${config.numberOfPersonSuggestions}`, (data) => data
        .filter((person) => !/^p\d+$/.test(person.id))
        .map((person) => ({
          value: person.id,
          label: `${person.name}${person.birth_year ? ` (född ${person.birth_year})` : ''}`,
        })), signal),
      fetchSuggestions(`${apiUrl}autocomplete/socken/?${queryParams}`, (data) => data.map((place) => ({
        value: place.name, label: `${place.name}${place.landskap ? ` (${place.landskap})` : ''}`,
      })), signal),
      fetchSuggestions(`${apiUrl}autocomplete/landskap/?${queryParams}`, (data) => data.map((province) => ({
        value: province.name, label: province.name,
      })), signal),
      fetchSuggestions(`${apiUrl}autocomplete/archive_ids/?${queryParams}`, (data) => data.map((record) => ({
        value: record.id, label: record.id,
      })), signal),
    ]).then((results) => {
      if (signal.aborted) return;
      const [people, places, provinces, archiveIds] = results.map((result) => (
        result.status === 'fulfilled' ? result.value : []
      ));
      setSuggestions({
        people, places, provinces, archiveIds, sourceQuery: query, sourceTheme: theme,
      });
    });
    return () => controller.abort();
  }, [query, theme]);

  const current = query.length >= 2
    && suggestions.sourceQuery === query && suggestions.sourceTheme === theme;
  return { ...(current ? suggestions : EMPTY_SUGGESTIONS), loading: query.length >= 2 && !current };
}
