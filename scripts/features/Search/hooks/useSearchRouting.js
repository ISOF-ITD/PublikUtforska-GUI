import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createSearchRoute } from '../../../utils/routeHelper';

const SEARCH_FILTER_FIELDS = ['person', 'place', 'archive_id'];

export default function useSearchRouting({
  mode,
  categories,
  setCategories,
  person,
  place,
  archiveId,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToSearch = useCallback(
    (
      keywordOverwrite,
      {
        filterUpdate = null,
        toggleCategory = null,
        resultView = null,
        clearFilters = false,
      } = {},
    ) => {
      let newCategories = categories;
      if (toggleCategory) {
        if (categories.includes(toggleCategory)) {
          newCategories = categories.filter(
            (category) => category !== toggleCategory,
          );
        } else {
          newCategories = [...categories, toggleCategory];
        }
      }

      setCategories(newCategories);

      const selectedFilters = clearFilters
        ? {}
        : {
          person,
          place,
          archive_id: archiveId,
        };

      if (filterUpdate && SEARCH_FILTER_FIELDS.includes(filterUpdate.field)) {
        selectedFilters[filterUpdate.field] = filterUpdate.value || undefined;
      }

      const route = createSearchRoute({
        search: keywordOverwrite || undefined,
        ...selectedFilters,
        category: newCategories.length ? newCategories : undefined,
      });
      const pathname = mode === 'transcribe' ? `/transcribe${route}` : route;
      const queryParams = new URLSearchParams(location.search);
      queryParams.delete('media');
      queryParams.delete('record_ids');

      const trackingSearch = [
        keywordOverwrite,
        selectedFilters.person ? `person:${selectedFilters.person}` : null,
        selectedFilters.place ? `place:${selectedFilters.place}` : null,
        selectedFilters.archive_id
          ? `archive_id:${selectedFilters.archive_id}`
          : null,
      ].filter(Boolean).join(' ');

      if (trackingSearch) {
        queryParams.set('s', trackingSearch);
      } else {
        queryParams.delete('s');
      }
      if (resultView === 'list') {
        queryParams.delete('showlist');
        queryParams.delete('showmap');
      } else if (resultView === 'map') {
        queryParams.delete('showlist');
        queryParams.set('showmap', '1');
      } else if (queryParams.has('showmap')) {
        queryParams.set('showmap', '1');
        queryParams.delete('showlist');
      } else {
        queryParams.delete('showlist');
      }

      const searchParam = queryParams.toString();
      navigate(`${pathname}${searchParam ? `?${searchParam}` : ''}`);
    },
    [
      archiveId,
      categories,
      location.search,
      mode,
      navigate,
      person,
      place,
      setCategories,
    ],
  );

  const toggleCategory = useCallback(
    (categoryId, keywordOverwrite, resultView = null) => (
      navigateToSearch(keywordOverwrite, {
        toggleCategory: categoryId,
        resultView,
      })
    ),
    [navigateToSearch],
  );

  return { navigateToSearch, toggleCategory };
}
