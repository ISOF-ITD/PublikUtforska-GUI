/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import config from '../../../config';
import loaderSpinner from '../../../../img/loader.gif';
import { l } from '../../../lang/Lang';
import { getTitleText } from '../../../utils/helpers';

function SimilarRecords({ data: { id } }) {
  const [similarRecords, setSimilarRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const openHelp = useCallback(() => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.HelpText', { kind: 'similarRecords' });
    }
  }, []);

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

  if (similarRecords.length === 0) {
    return null;
  }

  return (
    <div className="similar-records">
      <h3>
        Liknande uppteckningar
        <span
          role="button"
          tabIndex={0}
          className="switcher-help-button"
          title="Liknande uppteckningar genereras genom att analysera innehållet i den valda posten och identifiera andra uppteckningar med liknande ord och teman."
          onClick={openHelp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openHelp();
            }
          }}
          aria-label="Visa hjälptext för liknande uppteckningar"
        >
          ?
        </span>

      </h3>
      <div className="similar-records-list">
        {similarRecords.map(({ _id, _source }) => {
          const { media, title, places = [] } = _source;
          if (!media?.length) return null;

          const thumbnail = `${config.imageUrl}${media[0].source}`;
          const titleText = getTitleText(_source) || l('(Utan titel)');

          const place = places[0];
          const placeName = place ? `${place.name}, ${place.landskap || ''}` : '';

          return (
            <div key={_id} className="similar-record">
              <Link to={`/records/${_id}`}>
                <img
                  src={thumbnail}
                  alt={title || l('Liknande uppteckning')}
                  className="similar-record-thumbnail"
                  loading="lazy"
                />
                <div className="similar-record-title">
                  {titleText}
                  {placeName && ` (${placeName})`}
                </div>
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
  }).isRequired,
};

export default SimilarRecords;
