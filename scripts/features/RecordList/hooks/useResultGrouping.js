import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'recordListGrouping';
const CHANGE_EVENT = 'recordListGroupingChange';

function isGrouping(value) {
  return value === 'parish' || value === 'records';
}

function readStoredGrouping() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (isGrouping(value)) return value;
  } catch {
    // Storage may be disabled.
  }
  return 'records';
}

export default function useResultGrouping(enabled) {
  const location = useLocation();
  const navigate = useNavigate();
  const [storedGrouping, setStoredGrouping] = useState(readStoredGrouping);
  const routeGrouping = new URLSearchParams(location.search).get('group');
  const grouping = enabled && (isGrouping(routeGrouping) ? routeGrouping : storedGrouping);

  useEffect(() => {
    const onChange = (event) => {
      if (isGrouping(event.detail)) setStoredGrouping(event.detail);
    };
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setStoredGrouping(readStoredGrouping());
      }
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const toggleGrouping = useCallback(({ showList = false } = {}) => {
    const next = grouping === 'parish' ? 'records' : 'parish';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The URL still retains the selection when storage is disabled.
    }
    setStoredGrouping(next);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
    const query = new URLSearchParams(location.search);
    query.set('group', next);
    if (showList) {
      query.delete('showlist');
      query.delete('showmap');
    }
    navigate({ ...location, search: `?${query}` }, { replace: true });
  }, [grouping, location, navigate]);

  return { grouped: grouping === 'parish', toggleGrouping };
}
