import { useMemo } from "react";
import { l } from "../../../lang/Lang";
import config from "../../../config";
import { suggestionSort } from "../utils/suggestionSort";

export default function useSuggestionGroups({
  query,
  popularQueries,
  people,
  places,
  provinces,
  archiveIds,
  navigateToSearch,
  selectFilter,
  includeSearchSuggestions = true,
}) {
  const suggestionGroups = useMemo(
    () => {
      const searchGroup = {
        title: "Search",
        label: l("Vanligaste sökningar"),
        items: popularQueries.filter(({ label }) =>
          label.toLowerCase().includes(query.trim().toLowerCase())
        ),
        click: (s) => navigateToSearch(s.value),
        maxHeight: 240,
      };
      const filterGroups = [
        {
          title: "Person",
          label: l("Personer"),
          items: [...people].sort(suggestionSort(query)),
          field: "person",
          click: (p) => selectFilter('person', p.value),
        },
        {
          title: "Place",
          label: l("Orter"),
          items: places,
          field: "place",
          click: (p) => selectFilter('place', p.value),
        },
        {
          title: "Province",
          label: l("Landskap"),
          items: provinces,
          field: "place",
          click: (p) => selectFilter('place', p.value),
        },
        {
          title: "ArchiveId",
          label: l("Arkivsignum"),
          items: archiveIds,
          field: 'archive_id',
          click: (p) => selectFilter('archive_id', p.value),
        },
      ];

      return includeSearchSuggestions
        ? [searchGroup, ...filterGroups]
        : filterGroups;
    },
    [
      popularQueries,
      people,
      places,
      provinces,
      archiveIds,
      navigateToSearch,
      selectFilter,
      includeSearchSuggestions,
      query,
    ]
  );

  const visibleSuggestionGroups = useMemo(
    () =>
      suggestionGroups.map((g) => {
        const limit = config[`numberOf${g.title}Suggestions`];
        return { ...g, items: limit ? g.items.slice(0, limit) : g.items };
      }),
    [suggestionGroups]
  );

  const flatSuggestions = useMemo(
    () =>
      visibleSuggestionGroups.flatMap((g) =>
        g.items.map((it) => ({ ...it, click: g.click }))
      ),
    [visibleSuggestionGroups]
  );

  const hasSuggestions = flatSuggestions.length > 0;

  return {
    suggestionGroups,
    visibleSuggestionGroups,
    flatSuggestions,
    hasSuggestions,
  };
}
