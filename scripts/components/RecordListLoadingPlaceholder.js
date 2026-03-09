import {  } from 'react';

export default function RecordListLoadingPlaceholder() {
  const rows = ['w-full', 'w-11/12', 'w-10/12', 'w-full', 'w-9/12'];

  return (
    <div className="container" role="status" aria-live="polite" aria-label="Laddar sökträffar som lista">
      <div className="container-header">
        <div className="row">
          <div className="twelve columns px-4 md:px-6 py-4">
            <div className="h-8 w-2/3 rounded bg-white/70 animate-pulse mb-3" />
            {/* <div className="h-3 w-1/2 rounded bg-white/55 animate-pulse" /> */}
          </div>
        </div>
      </div>

      <div className="row px-4 md:px-6 py-5">
        <div className="w-full space-y-4">
          <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-slate-50 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="h-9 w-36 rounded-full bg-teal-200/70 animate-pulse" />
              <div className="h-9 w-28 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-9 w-24 rounded-full bg-slate-200/80 animate-pulse" />
            </div>
            <div className="space-y-3">
              {rows.map((width) => (
                <div
                  key={Math.random()}
                  className={`h-16 ${width} rounded-xl bg-white/90 ring-1 ring-slate-200 animate-pulse`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
