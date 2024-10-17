/* eslint-disable react/require-default-props */

import {
  Await, useLoaderData, useParams, useNavigate,
} from 'react-router-dom';

import { Suspense, useEffect } from 'react';
import PropTypes from 'prop-types';
import RecordList from './RecordList';
import SimpleMap from './SimpleMap';

import { createParamsFromSearchRoute } from '../../utils/routeHelper';
import config from '../../config';
import { l } from '../../lang/Lang';

export default function PlaceView({ highlightRecordsWithMetadataField = null, mode = 'material' }) {
  const { results } = useLoaderData();
  const params = useParams();
  const navigate = useNavigate();

  function validateResults(results) {
    if (!results) {
      return false;
    }

    if (!results.id) {
      return false;
    }

    return true;
  }

  // on unnount, set the document title back to the site title
  useEffect(() => () => {
    document.title = config.siteTitle;
  }, []);

  return (
    <div className="container">
      <div className="container-header">
        <div className="row">
          <Suspense>
            <Await resolve={results}>
              {(results) => {
                if (results.name) {
                  document.title = `${results.name} - ${config.siteTitle}`;
                }
                if (!validateResults(results)) {
                  navigate('/');
                  return null;
                }
                return (
                  <div className="twelve columns">
                    <h2>{results.name && results.name.replace(/ sn$/, ' socken')}</h2>
                    <p>
                      {
                      results.fylke && (
                        <span>
                          <strong>{l('Fylke')}</strong>
                          {' '}
                          {results.fylke}
                        </span>
                      )
                    }
                      {
                      !results.fylke && results.harad && (
                        <span>
                          <strong>{l('Härad')}</strong>
                          :
                          {' '}
                          {results.harad}
                          ,
                          {' '}
                          <strong>{l('Län')}</strong>
                          :
                          {' '}
                          {results.lan}
                          ,
                          {' '}
                          <strong>{l('Landskap')}</strong>
                          :
                          {' '}
                          {results.landskap}
                        </span>
                      )
                    }
                    </p>
                    {
                    results.comment && (
                      <p>
                        {results.comment}
                      </p>
                    )
                  }

                  </div>
                );
              }}
            </Await>
          </Suspense>
        </div>
      </div>

      <Suspense>
        <Await resolve={results}>
          {(results) => (
            <div>
              <div className="row">
                <div className="twelve columns">
                  {
                    results.location.lat && results.location.lon
                      ? (
                        <SimpleMap
                          marker={{
                            lat: results.location.lat,
                            lng: results.location.lon,
                            label: results.name,
                          }}
                        />
                      )
                      : null
                  }
                </div>
              </div>

              {/* show the following div only if params['*'] is truthy, which
              means that there is a search query in the URL */}
              {params['*'] && (
                <div className="row search-results-container">
                  <div className="twelve columns">

                    <h3>{l('Sökträffar')}</h3>

                    <RecordList
                      key={`PlaceView-RecordList-${results.id}`}
                      disableRouterPagination
                      highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
                      params={{
                        ...createParamsFromSearchRoute(params['*']),
                        place_id: results.id,
                        has_untranscribed_records: mode === 'transcribe' ? 'true' : null,
                        transcriptionstatus: mode === 'transcribe' ? null : 'published,accession',
                      }}
                      mode={mode}
                      hasFilter={mode !== 'transcribe'}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Await>
      </Suspense>

      <Suspense>
        <Await resolve={results}>
          {(results) => (
            <div>

              <div className="row">
                <div className="twelve columns">
                  {/* Show the h3 only if params['*'] is truthy, and we have two record lists */}
                  {params['*'] && (
                    <h3>
                      Samtliga
                      {' '}
                      {mode === 'material' ? 'accessioner och uppteckningar' : 'accessioner'}
                      {' '}
                      från orten
                    </h3>
                  )}

                  <RecordList
                    disableRouterPagination
                    highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
                    params={{
                      place_id: results.id,
                      has_untranscribed_records: mode === 'transcribe' ? 'true' : null,
                      transcriptionstatus: mode === 'transcribe' ? null : 'published,accession',
                    }}
                    mode={mode}
                    hasFilter={mode !== 'transcribe'}
                    // add a random id to be able to have the same form twice on the same page
                  />
                </div>
              </div>
            </div>
          )}
        </Await>
      </Suspense>

    </div>
  );
}

PlaceView.propTypes = {
  highlightRecordsWithMetadataField: PropTypes.string,
  mode: PropTypes.string,
};
