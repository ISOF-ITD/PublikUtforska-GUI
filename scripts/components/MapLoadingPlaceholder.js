import PropTypes from 'prop-types';
import Spinner from './Spinner';

export default function MapLoadingPlaceholder({
  overlay = false,
  announce = true,
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 grid place-items-center ${overlay ? 'z-[1100] bg-surface/70 backdrop-blur-[1px]' : 'z-[900]'}`}
      role={announce ? 'status' : undefined}
      aria-live={announce ? 'polite' : undefined}
      aria-atomic={announce || undefined}
      aria-label={announce ? 'Laddar kartan' : undefined}
      aria-hidden={announce ? undefined : 'true'}
    >
      {!overlay && (
        <>
          <div
            className="absolute inset-0"
            style={{ background: 'var(--color-bg-gradient)' }}
          />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(0deg, rgb(var(--color-surface-rgb) / 0.4) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--color-surface-rgb) / 0.4) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />
        </>
      )}
      <div className="relative inline-flex items-center gap-3 rounded-lg border border-border bg-surface/90 px-4 py-3 text-sm font-semibold text-body shadow-sm">
        <Spinner decorative size="md" className="text-link" />
        <span aria-hidden="true">Laddar karta…</span>
      </div>
    </div>
  );
}

MapLoadingPlaceholder.propTypes = {
  overlay: PropTypes.bool,
  announce: PropTypes.bool,
};
