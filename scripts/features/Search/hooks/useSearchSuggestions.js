import { useLocation } from 'react-router-dom';
import useAutocomplete from './useAutocomplete';
import usePopularQueries from './usePopularQueries';
import useSuggestionGroups from './useSuggestionGroups';

export default function useSearchSuggestions({
  query,
  suggestionsVisible,
  navigateToSearch,
  selectFilter,
  includeSearchSuggestions = true,
}) {
  const location = useLocation();
  const isMatkult = new URLSearchParams(location.search).get('theme') === 'matkult';
  const {
    people,
    places,
    provinces,
    archiveIds,
    loading,
  } = useAutocomplete(query);
  const popularQueries = usePopularQueries(suggestionsVisible && !isMatkult);

  const suggestionGroups = useSuggestionGroups({
    query,
    popularQueries: isMatkult ? [] : popularQueries,
    people,
    places,
    provinces,
    archiveIds,
    navigateToSearch,
    selectFilter,
    includeSearchSuggestions,
  });

  return { ...suggestionGroups, loading };
}
