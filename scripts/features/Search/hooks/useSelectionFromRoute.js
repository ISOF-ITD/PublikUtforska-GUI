import { useEffect, useState } from "react";
import {
  getPersonFetchLocation,
} from "../../../utils/helpers";

export default function useSelectionFromRoute(qParam, search_field) {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        if (search_field === "person" && qParam) {
          const r = await fetch(getPersonFetchLocation(qParam));
          if (!r.ok) throw new Error("Failed to fetch person");
          console.log("Fetched person:", r, qParam);
          const json = await r.json();
          if (!cancelled) {
            setSelectedPerson(json);
            setSelectedPlace(null);
          }
        } else if (search_field === "place" && qParam) {
          if (!cancelled) {
            console.log("Setting selected place:", qParam);
            setSelectedPlace(qParam);
            setSelectedPerson(null);
          }
        } else if (search_field === "archive_id" && qParam) {
          setSelectedArchiveId(qParam);
          setSelectedPerson(null);
          setSelectedPlace(null);
        } else if (!cancelled) {
          setSelectedPerson(null);
          setSelectedPlace(null);
          setSelectedArchiveId(null);
        }
      } catch {
        if (!cancelled) {
          setSelectedPerson(null);
          setSelectedPlace(null);
          setSelectedArchiveId(null);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [qParam, search_field]);

  const hasSelection = !!(selectedPerson || selectedPlace || selectedArchiveId);
  const labelPrefix = selectedPerson
    ? "Person: "
    : selectedPlace
    ? "Ort: "
    : selectedArchiveId
    ? "Arkivsignum: "
    : "";
  // const labelValue = selectedPerson?.name ?? selectedPlace?.name ?? "";
  const labelValue = selectedPerson
    ? selectedPerson.name
    : selectedPlace
    ? selectedPlace
    : selectedArchiveId
    ? selectedArchiveId
    : "";


  return {
    selectedPerson,
    selectedPlace,
    selectedArchiveId,
    hasSelection,
    labelPrefix,
    labelValue,
    setSelectedPerson,
    setSelectedPlace,
    setSelectedArchiveId,
  };
}
