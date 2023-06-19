import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import config from '../config';

// Is used for top lists, e.g. top 10 transcribers the current month
export default function StatisticsList({ params: rawParams, visible, label }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchStatistics = () => {
    const paramStrings = [];
    const queryParams = _.defaults(rawParams, config.requiredParams);

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value) {
        paramStrings.push(`${key}=${value}`);
      }
    });

    const paramString = paramStrings.join('&');

    fetch(`${config.apiUrl}documents?${paramString}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Fel vid hämtning av statistik');
      })
      .then((json) => {
        setData(json.aggregations.aggresult.buckets);
        setLoading(false);
        setFetchError(false);
      })
      .catch(() => {
        setLoading(false);
        setFetchError(true);
      });
  };

  useEffect(() => {
    if (visible) {
      fetchStatistics();

      const timer = setInterval(fetchStatistics, 60000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [visible]);

  return (
    <div className="statistics-list">
      {loading && <div className="loading">Hämtar statistik...</div>}
      {fetchError && <div className="error">Fel vid hämtning av statistik</div>}
      {!loading && !fetchError && <h3>{label}</h3>}
      {!loading && !fetchError && visible && (
      <ul>
        {data.map((item) => (
          <li key={`${item.key}-${item.doc_count}`}>
            <span className="key">
              {item.key}
            </span>
            :
            {' '}
            {item.doc_count}
            {' '}
            {item.doc_count === 1 ? 'uppteckning' : 'uppteckningar'}
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}

StatisticsList.propTypes = {
  params: PropTypes.object.isRequired,
  visible: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
};
