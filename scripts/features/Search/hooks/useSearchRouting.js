import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function useSearchRouting({
  mode,
  search_field: searchField,
  categories,
  setCategories,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToSearch = useCallback(
    (
      keywordOverwrite,
      searchFieldOverwriteProp = searchField ?? null,
      toggleCategory = null,
      resultView = null,
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

      const searchFieldOverwrite = keywordOverwrite
        ? searchFieldOverwriteProp
        : null;
      const segments = [];
      if (keywordOverwrite) {
        segments.push('search', encodeURIComponent(keywordOverwrite));
      }
      if (searchFieldOverwrite) {
        segments.push('search_field', searchFieldOverwrite);
      }
      if (newCategories.length) {
        segments.push('category', newCategories.join(','));
      }

      const transcribePrefix = mode === 'transcribe' ? 'transcribe/' : '';
      const pathname = `/${transcribePrefix}${segments.join('/')}`;
      const queryParams = new URLSearchParams(location.search);
      queryParams.delete('media');
      queryParams.delete('record_ids');

      if (keywordOverwrite) {
        queryParams.set(
          's',
          `${searchFieldOverwrite ? `${searchFieldOverwrite}:` : ''}${keywordOverwrite}`,
        );
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
    [categories, location.search, mode, navigate, searchField, setCategories],
  );

  const toggleCategory = useCallback(
    (categoryId, keywordOverwrite, resultView = null) => (
      navigateToSearch(keywordOverwrite, undefined, categoryId, resultView)
    ),
    [navigateToSearch],
  );

  return { navigateToSearch, toggleCategory };
}
