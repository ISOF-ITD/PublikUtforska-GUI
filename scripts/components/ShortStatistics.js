import { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';
import PropTypes from 'prop-types';
import config from '../config';

export default function ShortStatistics({ visible, params, label }) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const animatedValue = useSpring({
    from: { number: 0 },
    number: value,
    config: { duration: 1000 },
  });

  const fetchStatistics = () => {
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
    if (visible) {
      fetchStatistics();
      const timer = setInterval(fetchStatistics, 60000);
      return () => clearInterval(timer);
    }
    return () => {}; // return a no-op function if no cleanup is necessary
  }, [visible, params]);

  return (
    <div className="short-statistics">
      {!value && loading && <div className="loading">Hämtar statistik...</div>}
      {error && <div className="error">Fel vid hämtning av statistik</div>}
      {!loading && !error && visible && (
        <animated.div className="value">
          {animatedValue.number.to((num) => Math.floor(num).toLocaleString('sv-SE'))}
        </animated.div>
      )}
      {!loading && !error && <div className="label">{label}</div>}
    </div>
  );
}

ShortStatistics.propTypes = {
  visible: PropTypes.bool.isRequired,
  params: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
};
