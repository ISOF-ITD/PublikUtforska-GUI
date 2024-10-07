/* eslint-disable react/require-default-props */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import config from '../config';

export default function StatisticsList({
  params: rawParams = {},
  label,
  type,
  shouldFetch = false,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchStatistics = async () => {
    // console.log("hämtar statisticsList")
    const queryParams = { ...config.requiredParams, ...rawParams };
    const paramString = new URLSearchParams(queryParams).toString();

    let esApiEndpoint;
    switch (type) {
      case 'topTranscribersByPages':
        esApiEndpoint = 'statistics/get_top_transcribers_by_pages/';
        break;
      default:
        setFetchError(`Unsupported type: ${type}`);
        return;
    }

    try {
      const response = await fetch(`${config.apiUrl}${esApiEndpoint}?${paramString}`);

      if (!response.ok) {
        throw new Error('Fel vid hämtning av statistik');
      }

      const json = await response.json();
      setData(json.data);
      setLoading(false);
      setFetchError(false);
    } catch (error) {
      setLoading(false);
      setFetchError(error.message);
    }
  };

  useEffect(() => {
    if (shouldFetch) {
      fetchStatistics();
    }
  }, [shouldFetch]);

  return (
    <div className="statistics-list">
      {loading && <div className="loading">Hämtar statistik...</div>}
      {fetchError && (
        <div className="error">
          Fel vid hämtning av statistik:
          {' '}
          {fetchError}
        </div>
      )}
      {!loading && !fetchError && <h3>{label}</h3>}
      {!loading && !fetchError && data && (
        <ol>
          {data.map((item) => (
            <li key={`${item.key}-${item.value}`}>
              <span className="key">
                {item.key}
              </span>
              :
              {' '}
              {parseInt(item.value, 10).toLocaleString('sv-SE')}
              {' '}
              {item.value === 1 ? 'sida' : 'sidor'}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

StatisticsList.propTypes = {
  params: PropTypes.object,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  shouldFetch: PropTypes.bool,
};
