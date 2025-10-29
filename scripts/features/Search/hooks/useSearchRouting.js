import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function useSearchRouting({
  mode,
  search_field,
  categories,
  setCategories,
}) {
  const navigate = useNavigate();

  const navigateToSearch = useCallback(
    (
      keywordOverwrite,
      searchFieldOverwriteProp = search_field ?? null,
      toggleCategory = null
    ) => {
      const newCats = toggleCategory
        ? categories.includes(toggleCategory)
          ? categories.filter((c) => c !== toggleCategory)
          : [...categories, toggleCategory]
        : categories;

      setCategories(newCats);

      const searchFieldOverwrite = keywordOverwrite
        ? searchFieldOverwriteProp
        : null;

      const segments = [];
      if (keywordOverwrite)
        segments.push("search", encodeURIComponent(keywordOverwrite));
      if (searchFieldOverwrite)
        segments.push("search_field", searchFieldOverwrite);
      if (newCats.length) segments.push("category", newCats.join(","));

      const transcribePrefix = mode === "transcribe" ? "transcribe/" : "";
      const pathname = `/${transcribePrefix}${segments.join("/")}`;

      const searchParam = keywordOverwrite
        ? `?s=${
            searchFieldOverwrite ? `${searchFieldOverwrite}:` : ""
          }${encodeURIComponent(keywordOverwrite)}`
        : "";

      navigate(`${pathname}${searchParam}`);
    },
    [categories, mode, navigate, search_field, setCategories]
  );

  const toggleCategory = useCallback(
    (categoryId, keywordOverwrite) =>
      navigateToSearch(keywordOverwrite, undefined, categoryId),
    [navigateToSearch]
  );
  return { navigateToSearch, toggleCategory };
}
