import { useState, useEffect, useRef } from 'react';
import { animated, useSpring } from '@react-spring/web';
import PropTypes from 'prop-types';
import config from '../config';
import { l } from '../lang/Lang';

export default function ShortStatistics({
  params,
  label,
  compareAndUpdateStat,
  shouldFetch = false,
}) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(!!compareAndUpdateStat);
  const [error, setError] = useState(false);

  const animatedValue = useSpring({
    from: { number: 0 },
    number: value,
    config: { duration: 1000 },
  });

  const controllerRef = useRef(null);

  const fetchStatistics = () => {
    // console.log("hämtar shortStatistics")
    const queryParams = { ...config.requiredParams, ...params };
    const paramString = new URLSearchParams(queryParams).toString();

    fetch(`${config.apiUrl}count?${paramString}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Fel vid hämtning av statistik');
      })
      .then((json) => {
        if (compareAndUpdateStat) {
          compareAndUpdateStat(json.data.value);
        }
        setValue(json.data.value);
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  };

  useEffect(() => {
    if (compareAndUpdateStat) {
      // console.log("hämtar för att onDataChange is truthy")
      fetchStatistics();
      const timer = setInterval(fetchStatistics, 60000);
      return () => clearInterval(timer);
    }
    return () => {}; // no-op cleanup
  }, []);

  useEffect(() => {
    if (shouldFetch) {
      fetchStatistics();
    }
  }, [shouldFetch]);

  return (
    <div className="short-statistics">
      {loading && <div className="loading" role="status" aria-live="polite">{l("Hämtar statistik...")}</div>}
      {error && <div className="error">Fel vid hämtning av statistik</div>}
      {!loading && !error && (
        <animated.div className="value">
          {animatedValue.number.to((num) => Math.floor(num).toLocaleString('sv-SE'))}
        </animated.div>
      )}
      {!loading && !error && <div className="label">{label}</div>}
    </div>
  );
}

ShortStatistics.propTypes = {
  params: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  compareAndUpdateStat: PropTypes.func,
  shouldFetch: PropTypes.bool,
};

