import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import config from '../config';
import localLibrary from '../utils/localLibrary';

export const STARRED_RECORDS_EVENT = 'starredRecords.changed';
export const STARRED_RECORDS_RETURN_STORAGE_KEY = 'starredRecords.returnTo';

function getStarredRecords() {
  return localLibrary.list();
}

function dispatchStarredRecordsChanged() {
  window.dispatchEvent(new CustomEvent(STARRED_RECORDS_EVENT));
}

export default function useStarredRecords() {
  const [items, setItems] = useState(() => getStarredRecords());

  const refresh = useCallback(() => {
    setItems(getStarredRecords());
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event.key || event.key === config.localLibraryName) {
        refresh();
      }
    };

    window.addEventListener(STARRED_RECORDS_EVENT, refresh);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(STARRED_RECORDS_EVENT, refresh);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refresh]);

  const ids = useMemo(
    () => items.map((item) => item.id).filter(Boolean),
    [items],
  );

  const idSet = useMemo(() => new Set(ids.map(String)), [ids]);

  const isStarred = useCallback(
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
    dispatchStarredRecordsChanged();
  }, [refresh]);

  return {
    ids,
    count: ids.length,
    isStarred,
    toggle,
  };
}
