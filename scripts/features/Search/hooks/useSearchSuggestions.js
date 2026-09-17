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
  const {
    people,
    places,
    provinces,
    archiveIds,
    loading,
  } = useAutocomplete(query);
  const popularQueries = usePopularQueries(suggestionsVisible);

  const suggestionGroups = useSuggestionGroups({
    query,
    popularQueries,
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
