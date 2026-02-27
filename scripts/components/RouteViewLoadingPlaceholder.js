import PropTypes from 'prop-types';

const headerConfigs = {
  place: {
    title: 'w-2/3',
    subtitle: 'w-1/2',
    rows: [{ wrap: 'flex flex-wrap gap-2', bar: 'h-6 bg-white/75 animate-pulse', widths: ['w-2/5'] }],
  },
  record: {
    title: 'w-3/4',
    subtitle: 'w-1/3',
    rows: [{ wrap: 'flex flex-wrap gap-2', bar: 'h-6 bg-white/75 animate-pulse', widths: ['w-24', 'w-28', 'w-20', 'w-24'] }],
  },
  person: {
    title: 'w-2/3',
    subtitle: 'w-1/2',
    rows: [{ wrap: 'flex gap-2', bar: 'h-8 bg-white/75 animate-pulse', widths: ['w-28', 'w-28'] }],
  },
};

function renderBars(widths, cls) {
  const seen = {};
  return widths.map((w) => {
    seen[w] = (seen[w] || 0) + 1;
    return <div key={`${w}-${seen[w]}-${cls}`} className={`${cls} ${w} rounded`} />;
  });
}

export default function RouteViewLoadingPlaceholder({ kind = 'record' }) {
  const cfg = headerConfigs[kind];
  if (!cfg) return <div role="status" aria-live="polite" />;

  return (
    <div className="container" role="status" aria-live="polite">
      <div className="container-header">
        <div className="row">
          <div className="twelve columns px-4 md:px-6 py-4">
            <div className={`h-8 ${cfg.title} rounded bg-white/70 animate-pulse mb-3`} />
            <div className={`h-3 ${cfg.subtitle} rounded bg-white/60 animate-pulse mb-3`} />
            {cfg.rows.map(({ wrap, bar, widths }) => (
              <div key={`${kind}-${bar}`} className={wrap}>
                {renderBars(widths, bar)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

RouteViewLoadingPlaceholder.propTypes = {
  kind: PropTypes.oneOf(['place', 'record', 'person', 'correction']),
};
