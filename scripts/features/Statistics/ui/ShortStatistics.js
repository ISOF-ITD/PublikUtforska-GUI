import {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { animated, useSpring } from '@react-spring/web';
import PropTypes from 'prop-types';
import config from '../../../config';
import { l } from '../../../lang/Lang';

export default function ShortStatistics({
  params,
  label,
  compareAndUpdateStat,
  shouldFetch = false,
  compact = false,
  valueSource = 'value',
}) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(!!compareAndUpdateStat || shouldFetch);
  const [error, setError] = useState('');

  const abortRef = useRef(null);
  const inflightRef = useRef(false);
  const valueRef = useRef(null);

  const displayValue = useMemo(
    () => (typeof value === 'number' ? value : 0),
    [value],
  );

  const animatedValue = useSpring({
    from: { number: 0 },
    number: displayValue,
    config: { duration: 1000 },
  });

  const fetchStatistics = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (valueRef.current === null) setLoading(true);
      setError('');

      const queryParams = { ...config.requiredParams, ...params };
      const paramString = new URLSearchParams(queryParams).toString();

      const res = await fetch(`${config.apiUrl}media_count?${paramString}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(l('Fel vid hämtning av statistik'));

      const json = await res.json();
      const nextValue = valueSource === 'aggresult'
        ? Number(json?.data?.aggresult?.value ?? 0)
        : Number(json?.data?.value ?? 0);

      compareAndUpdateStat?.(nextValue);
      valueRef.current = nextValue;
      setValue(nextValue);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || String(e));
    } finally {
      inflightRef.current = false;
      if (!abortRef.current?.signal.aborted) setLoading(false);
    }
  }, [compareAndUpdateStat, params, valueSource]);

  useEffect(() => {
    if (!compareAndUpdateStat) return undefined;

    fetchStatistics();
    const id = setInterval(fetchStatistics, 60_000);

    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [compareAndUpdateStat, fetchStatistics]);

  useEffect(() => {
    if (!shouldFetch) return;
    fetchStatistics();
  }, [shouldFetch, fetchStatistics]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div
      className={
        compact
          ? 'min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3'
          : ''
      }
    >
      {loading && (
        <div
          className="loading text-sm text-slate-600"
          role="status"
          aria-live="polite"
        >
          {l('Hämtar statistik...')}
        </div>
      )}
      {!!error && (
        <div
          className="error text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {l('Fel vid hämtning av statistik')}
          :
          {error}
        </div>
      )}
      {!loading && !error && (
        <>
          <animated.div
            className={
              compact
                ? 'font-barlow text-3xl font-bold leading-none text-slate-900'
                : 'font-barlow text-4xl font-bold'
            }
          >
            {animatedValue.number.to((num) => Math.floor(num).toLocaleString('sv-SE'))}
          </animated.div>
          <div className={compact ? 'mt-2 text-sm text-slate-600' : ''}>
            {label}
          </div>
        </>
      )}
    </div>
  );
}

ShortStatistics.propTypes = {
  params: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  compareAndUpdateStat: PropTypes.func,
  shouldFetch: PropTypes.bool,
  compact: PropTypes.bool,
  valueSource: PropTypes.oneOf(['value', 'aggresult']),
};
