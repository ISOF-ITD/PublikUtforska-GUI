import { useEffect, useState } from "react";
import {
  getPersonFetchLocation,
  getPlaceFetchLocation,
} from "../../../utils/helpers";

export default function useSelectionFromRoute(qParam, search_field) {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (search_field === "person" && qParam) {
        const r = await fetch(getPersonFetchLocation(qParam));
        const json = await r.json();
        if (!cancelled) setSelectedPerson(json);
        if (!cancelled) setSelectedPlace(null);
      } else if (search_field === "place" && qParam) {
        const r = await fetch(getPlaceFetchLocation(qParam));
        const json = await r.json();
        if (!cancelled) setSelectedPlace(json);
        if (!cancelled) setSelectedPerson(null);
      } else {
        if (!cancelled) {
          setSelectedPerson(null);
          setSelectedPlace(null);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [qParam, search_field]);

  const hasSelection = !!(selectedPerson || selectedPlace);
  const labelPrefix = selectedPerson
    ? "Person: "
    : selectedPlace
    ? "Ort: "
    : "";
  const labelValue = selectedPerson?.name ?? selectedPlace?.name ?? "";

  return {
    selectedPerson,
    selectedPlace,
    hasSelection,
    labelPrefix,
    labelValue,
    setSelectedPerson,
    setSelectedPlace,
  };
}
