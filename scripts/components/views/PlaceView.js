/* eslint-disable no-shadow */
import _ from 'underscore';
import {
  Await, useLoaderData, useParams,
} from 'react-router-dom';

import { Suspense } from 'react';
import PropTypes from 'prop-types';
import RecordList from './RecordList';
import SimpleMap from './SimpleMap';

import { createParamsFromSearchRoute } from '../../utils/routeHelper';

export default function PlaceView({ highlightRecordsWithMetadataField, mode }) {
  PlaceView.propTypes = {
    highlightRecordsWithMetadataField: PropTypes.string,
    mode: PropTypes.string,
  };

  PlaceView.defaultProps = {
    highlightRecordsWithMetadataField: null,
    mode: 'material',
  };

  const { results } = useLoaderData();
  const params = useParams();

  return (
    <div className="container">
      <div className="container-header">
        <div className="row">
          <Suspense>
            <Await resolve={results}>
              {(results) => (
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
              )}
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
                      }}
                      mode={mode}
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
                    }}
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
