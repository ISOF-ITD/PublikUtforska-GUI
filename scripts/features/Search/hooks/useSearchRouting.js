import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  createSearchLocation,
  parseResultSearch,
} from '../../../utils/routeHelper';

const SEARCH_FILTER_FIELDS = ['person', 'place', 'archive_id'];

export default function useSearchRouting({
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

      const resultParams = parseResultSearch(location.search);
      const selectedFilters = {
        person: clearFilters ? undefined : person,
        place: clearFilters ? undefined : place,
        archive_id: clearFilters ? undefined : archiveId,
      };

      if (filterUpdate && SEARCH_FILTER_FIELDS.includes(filterUpdate.field)) {
        selectedFilters[filterUpdate.field] = filterUpdate.value || undefined;
      }

      Object.assign(resultParams, {
        search: keywordOverwrite || undefined,
        ...selectedFilters,
        category: newCategories.length ? newCategories : undefined,
      });
      delete resultParams.record_ids;

      const queryParams = new URLSearchParams(location.search);
      queryParams.delete('media');
      queryParams.delete('record_ids');
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

      navigate(createSearchLocation(resultParams, queryParams.toString()));
    },
    [
      archiveId,
      categories,
      location.search,
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
