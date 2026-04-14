/* eslint-disable react/require-default-props */

import {
  Await, useLoaderData, useParams, useNavigate,
} from 'react-router-dom';

import { Suspense, useEffect } from 'react';
import PropTypes from 'prop-types';
import SimpleMap from './SimpleMap';

import { createParamsFromSearchRoute } from '../../utils/routeHelper';
import config from '../../config';
import { l } from '../../lang/Lang';
import RecordList from '../../features/RecordList/RecordList';
import RouteViewLoadingPlaceholder from '../RouteViewLoadingPlaceholder';

const renderMetadataItem = (label, value) => (
  <div key={label} className="mr-2.5 inline">
    <dt className="inline m-0 font-semibold">{label && `${label}: `}</dt>
    <dd className="inline m-0">{value}</dd>
  </div>
);

export default function PlaceView({ highlightRecordsWithMetadataField = null, mode = 'material' }) {
  const { results } = useLoaderData();
  const params = useParams();
  const navigate = useNavigate();

  function validateResults(data) {
    if (!data) {
      return false;
    }

    if (!data.id) {
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
      <Suspense fallback={<RouteViewLoadingPlaceholder kind="place" inline />}>
        <div className="container-header max-lg:!pt-[74px]">
          <div className="row">
            <Await resolve={results}>
              {(data) => {
                if (data.name) {
                  document.title = `${data.name} - ${config.siteTitle}`;
                }
                if (!validateResults(data)) {
                  navigate('/');
                  return null;
                }
                return (
                  <div className="twelve columns">
                    <h1>{data.name && data.name.replace(/ sn$/, ' socken')}</h1>
                    <dl className="m-0">
                      {data.fylke && renderMetadataItem(l('Fylke'), data.fylke)}
                      {!data.fylke && data.harad
                        && renderMetadataItem(l('H\u00E4rad'), data.harad)}
                      {!data.fylke && data.landskap
                        && renderMetadataItem(l('Landskap'), data.landskap)}
                    </dl>
                    {
                      data.comment && (
                        <p>
                          {data.comment}
                        </p>
                      )
                    }

                  </div>
                );
              }}
            </Await>
          </div>
        </div>
      </Suspense>

      <Suspense>
        <Await resolve={results}>
          {(data) => (
            <div>
              <div className="row">
                <div className="twelve columns">
                  {
                    data.location.lat && data.location.lon
                      ? (
                        <SimpleMap
                          marker={{
                            lat: data.location.lat,
                            lng: data.location.lon,
                            label: data.name,
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
                      key={`PlaceView-RecordList-${data.id}`}
                      disableRouterPagination
                      showViewToggle={false}
                      highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
                      params={{
                        ...createParamsFromSearchRoute(params['*']),
                        place_id: data.id,
                        has_untranscribed_records: mode === 'transcribe' ? 'true' : null,
                        transcriptionstatus: mode === 'transcribe' ? null : 'published,accession,readytocontribute,readytotranscribe,undertranscription',
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
          {(data) => (
            <div>

              <div className="row">
                <div className="twelve columns">
                  {/* Show the h3 only if params['*'] is truthy, and we have two record lists */}
                  {params['*'] && (
                    <h3>
                      {l('Samtliga accessioner från orten')}
                    </h3>
                  )}

                  <RecordList
                    disableRouterPagination
                    highlightRecordsWithMetadataField={highlightRecordsWithMetadataField}
                    params={{
                      place_id: data.id,
                      has_untranscribed_records: mode === 'transcribe' ? 'true' : null,
                      transcriptionstatus: mode === 'transcribe' ? null : 'published,accession,readytocontribute,readytotranscribe,undertranscription',
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
