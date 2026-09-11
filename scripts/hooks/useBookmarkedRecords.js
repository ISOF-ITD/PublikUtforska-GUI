import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import config from '../config';
import localLibrary from '../utils/localLibrary';

export const BOOKMARKED_RECORDS_EVENT = 'bookmarkedRecords.changed';
export const BOOKMARKED_RECORDS_RETURN_STORAGE_KEY = 'bookmarkedRecords.returnTo';

function getBookmarkedRecords() {
  return localLibrary.list();
}

function dispatchBookmarkedRecordsChanged() {
  window.dispatchEvent(new CustomEvent(BOOKMARKED_RECORDS_EVENT));
}

export default function useBookmarkedRecords() {
  const [items, setItems] = useState(() => getBookmarkedRecords());

  const refresh = useCallback(() => {
    setItems(getBookmarkedRecords());
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event.key || event.key === config.localLibraryName) {
        refresh();
      }
    };

    window.addEventListener(BOOKMARKED_RECORDS_EVENT, refresh);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(BOOKMARKED_RECORDS_EVENT, refresh);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refresh]);

  const ids = useMemo(
    () => items.map((item) => item.id).filter(Boolean),
    [items],
  );

  const idSet = useMemo(() => new Set(ids.map(String)), [ids]);

  const isBookmarked = useCallback(
    (id) => idSet.has(String(id)),
    [idSet],
  );

  const toggle = useCallback((record) => {
    const id = typeof record === 'object' ? record?.id : record;
    if (!id) return;

    if (localLibrary.find(id)) {
      localLibrary.remove(id);
    } else {
      localLibrary.add(record);
    }

    refresh();
    dispatchBookmarkedRecordsChanged();
  }, [refresh]);

  return {
    ids,
    count: ids.length,
    isBookmarked,
    toggle,
  };
}
