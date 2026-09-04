import { useEffect, useState } from 'react';
import {
  getPersonFetchLocation,
} from '../../../utils/helpers';

export default function useSelectionFromRoute({ person, place, archiveId }) {
  const [personDetails, setPersonDetails] = useState(null);

  useEffect(() => {
    if (!person) {
      setPersonDetails(null);
      return undefined;
    }

    let cancelled = false;

    async function run() {
      try {
        const response = await fetch(getPersonFetchLocation(person));
        if (!response.ok) throw new Error('Failed to fetch person');
        const json = await response.json();
        if (!cancelled) setPersonDetails(json);
      } catch {
        if (!cancelled) setPersonDetails(null);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [person]);

  return {
    selectedPerson: person
      ? personDetails || { id: person, name: person }
      : null,
    selectedPlace: place || null,
    selectedArchiveId: archiveId || null,
  };
}
