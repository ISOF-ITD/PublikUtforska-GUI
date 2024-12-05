/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import config from '../../../config';
import loaderSpinner from '../../../../img/loader.gif';
import { l } from '../../../lang/Lang';

function SimilarRecords({ data: { id, recordtype } }) {
  const [similarRecords, setSimilarRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const openHelp = useCallback(() => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.similarRecordsHelpText', {});
    }
  }, []); // Tom array för att se till att funktionen inte återskapas varje gång

  useEffect(() => {
    const fetchSimilarRecords = async () => {
      try {
        const response = await fetch(`${config.apiUrl}similar/${id}/`);
        if (!response.ok) {
          throw new Error('Failed to fetch similar records.');
        }
        const result = await response.json();
        setSimilarRecords(result.hits.hits);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarRecords();
  }, [id]);

  if (loading) {
    return (
      <div className="similar-records loading">
        <img src={loaderSpinner} alt="Loading similar records" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="similar-records error">
        Error:
        {error}
      </div>
    );
  }

  if (recordtype !== 'one_record') {
    return null;
  }

  if (similarRecords.length === 0) {
    // return <div className="similar-records no-results">Inga liknande uppteckningar hittades.</div>;
    return null;
  }

  return (
    <div className="similar-records">
      <h3>
        Liknande uppteckningar
        <span
          className="switcher-help-button"
          title="Liknande uppteckningar genereras genom att analysera innehållet i den valda posten och identifiera andra uppteckningar med liknande ord och teman."
          onClick={openHelp}
        >
          ?
        </span>
      </h3>
      <div className="similar-records-list">
        {similarRecords.map((record) => {
          const { _id, _source: recordData } = record;
          if (!recordData.media || recordData.media.length === 0) {
            return null;
          }

          const thumbnail = config.imageUrl + recordData.media[0].source;

          return (
            <div key={_id} className="similar-record">
              <Link to={`/records/${_id}`}>
                <img
                  src={thumbnail}
                  alt={recordData.title || l('Liknande uppteckning')}
                  className="similar-record-thumbnail"
                  loading="lazy"
                />
                <div className="similar-record-title">{recordData.title}</div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

SimilarRecords.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    recordtype: PropTypes.string,
  }).isRequired,
};

export default SimilarRecords;
