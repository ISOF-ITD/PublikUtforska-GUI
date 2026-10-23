import { useEffect, useState } from 'react';
import { l } from '../lang/Lang';

function getWarningUrl() {
  const script = Array.from(document.scripts)
    .find(({ src }) => src.includes('/bndl.') || src.includes('/releases/'));

  if (!script) return '/varning.html';

  // The warning is editable at the stable root, outside versioned releases.
  const baseUrl = script.src.includes('/releases/')
    ? new URL('../../', script.src)
    : new URL('.', script.src);
  return new URL('varning.html', baseUrl).href;
}

export default function ServiceWarning() {
  const [html, setHtml] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    fetch(getWarningUrl(), { cache: 'no-store', signal: controller.signal })
      .then((response) => (response.ok ? response.text() : ''))
      .then((content) => {
        // A missing file may return the app's index.html through the SPA fallback.
        if (!controller.signal.aborted && !/^\s*(<!doctype|<html[\s>])/i.test(content)) {
          setHtml(content.trim());
        }
      })
      .catch(() => {
        // An unavailable optional warning must not interrupt the application.
      });

    return () => controller.abort();
  }, []);

  return html ? (
    <div
      role="alert"
      aria-label={l('Driftinformation')}
      className="m-3 shrink-0 break-words rounded-md border border-solid border-current bg-[var(--color-warning-bg)] p-4 text-base leading-relaxed text-[var(--color-warning-text)]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : null;
}
