import PropTypes from 'prop-types';

export default function RecordListLoadingPlaceholder({
  embedded = false,
  announce = true,
}) {
  const rows = [
    { key: 'full-top', width: 'w-full' },
    { key: 'eleven-twelfths', width: 'w-11/12' },
    { key: 'ten-twelfths', width: 'w-10/12' },
    { key: 'full-bottom', width: 'w-full' },
    { key: 'nine-twelfths', width: 'w-9/12' },
  ];

  return (
    <div
      className={embedded ? 'w-full text-body' : 'min-h-full bg-surface text-body'}
      role={announce ? 'status' : undefined}
      aria-live={announce ? 'polite' : undefined}
      aria-atomic={announce || undefined}
      aria-label={announce ? 'Söker efter arkivmaterial' : undefined}
    >
      <div aria-hidden="true">
        {!embedded && (
          <header className="bg-primary px-4 pb-6 pt-[9rem] md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-screen-2xl">
              <div className="h-8 w-2/3 rounded bg-surface/70 motion-safe:animate-pulse" />
            </div>
          </header>
        )}

        <div className={embedded
          ? 'w-full py-4'
          : 'mx-auto w-full max-w-screen-2xl px-4 pb-28 pt-6 md:px-8 md:pb-24'}
        >
          <div className="w-full space-y-4">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-surface-muted via-surface to-surface p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="h-9 w-36 rounded-full bg-primary/20 motion-safe:animate-pulse" />
                <div className="h-9 w-28 rounded-full bg-surface-hover motion-safe:animate-pulse" />
                <div className="h-9 w-24 rounded-full bg-surface-hover/80 motion-safe:animate-pulse" />
              </div>
              <div className="space-y-3">
                {rows.map((row) => (
                  <div
                    key={row.key}
                    className={`h-16 ${row.width} max-w-full rounded-xl bg-surface/90 ring-1 ring-border motion-safe:animate-pulse`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

RecordListLoadingPlaceholder.propTypes = {
  embedded: PropTypes.bool,
  announce: PropTypes.bool,
};
