export default function RecordListLoadingPlaceholder() {
  const rows = [
    { key: 'full-top', width: 'w-full' },
    { key: 'eleven-twelfths', width: 'w-11/12' },
    { key: 'ten-twelfths', width: 'w-10/12' },
    { key: 'full-bottom', width: 'w-full' },
    { key: 'nine-twelfths', width: 'w-9/12' },
  ];

  return (
    <div className="container" role="status" aria-live="polite" aria-label="Laddar sökträffar som lista">
      <div className="container-header max-lg:!pt-[74px]">
        <div className="row">
          <div className="twelve columns px-4 md:px-6 py-4">
            <div className="h-8 w-2/3 rounded bg-surface/70 animate-pulse mb-3" />
            {/* <div className="h-3 w-1/2 rounded bg-white/55 animate-pulse" /> */}
          </div>
        </div>
      </div>

      <div className="row px-4 md:px-6 py-5">
        <div className="w-full space-y-4">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-surface-muted via-surface to-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="h-9 w-36 rounded-full bg-primary/20 animate-pulse" />
              <div className="h-9 w-28 rounded-full bg-surface-hover animate-pulse" />
              <div className="h-9 w-24 rounded-full bg-surface-hover/80 animate-pulse" />
            </div>
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.key}
                  className={`h-16 ${row.width} rounded-xl bg-surface/90 ring-1 ring-border animate-pulse`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
