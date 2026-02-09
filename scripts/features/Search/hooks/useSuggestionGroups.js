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
}) {
  const suggestionGroups = useMemo(
    () => [
      {
        title: "Search",
        label: l("Vanligaste sökningar"),
        items: popularQueries.filter(({ label }) =>
          label.toLowerCase().includes(query.trim().toLowerCase())
        ),
        click: (s) => navigateToSearch(s.value),
        maxHeight: 240,
      },
      {
        title: "Person",
        label: l("Personer"),
        items: [...people].sort(suggestionSort(query)),
        field: "person",
        click: (p) => navigateToSearch(p.value, "person"),
      },
      {
        title: "Place",
        label: l("Orter"),
        items: places,
        field: "place",
        click: (p) => navigateToSearch(p.value, "place"),
      },
      {
        title: "Province",
        label: l("Landskap"),
        items: provinces,
        field: "place",
        click: (p) => navigateToSearch(p.value, "place"),
      },
      {
        title: "ArchiveId",
        label: l("Arkivsignum"),
        items: archiveIds,
        click: (p) => navigateToSearch(p.value, "archive_id"),
      },
    ],
    [
      popularQueries,
      people,
      places,
      provinces,
      archiveIds,
      navigateToSearch,
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
