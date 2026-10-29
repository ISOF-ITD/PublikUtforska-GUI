import { useEffect, useState } from 'react';
import { fetchMatkultArticle } from './sitevisionArticle';

export default function useMatkultArticle(url) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ url: null, status: 'idle', html: '' });

  useEffect(() => {
    if (!url) return undefined;
    const controller = new AbortController();
    const { signal } = controller;
    setResult({ url, status: 'loading', html: '' });
    const timeout = setTimeout(() => controller.abort(), 10000);
    let active = true;
    fetchMatkultArticle(url, signal).then((html) => {
      if (active && !signal.aborted) setResult({ url, status: 'ready', html });
    }).catch(() => {
      if (active) setResult({ url, status: 'error', html: '' });
    }).finally(() => clearTimeout(timeout));

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [url, attempt]);

  const current = result.url === url ? result : { status: url ? 'loading' : 'idle', html: '' };
  return { ...current, retry: () => setAttempt((value) => value + 1) };
}
