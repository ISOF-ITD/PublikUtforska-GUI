/* eslint-disable react/require-default-props */
import { useEffect } from 'react';
import { useLoaderData, useLocation, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import ContributeInfoButton from './ContributeInfoButton';
import SimpleMap from './SimpleMap';
import FeedbackButton from './FeedbackButton';
import { l } from '../../lang/Lang';

import config from '../../config';
import RecordList from '../../features/RecordList/RecordList';

export default function PersonView({ mode = 'material' }) {
  const {
    biography,
    birthplace,
    birth_year: birthYear,
    id,
    imagepath,
    name,
    places,
  } = useLoaderData();
  const location = useLocation();

  useEffect(() => {
    document.title = `${name} - ${config.siteTitle}`;
  }, [name]);

  // on unnount, set the document title back to the site title
  useEffect(() => () => {
    document.title = config.siteTitle;
  }, []);

  // Prepare person county/region:
  let personCounty = '';
  if (places) {
    if (places[0]) {
      const place = places[0];
      if (place) {
        personCounty = place.name;
        if (place.landskap) {
          personCounty = `${personCounty}, ${place.landskap}`;
        }
        // TODO: set landskap = fylke in database and remove this?
        if (place.fylke) {
          personCounty = `${personCounty}, ${place.fylke}`;
        }
      }
    }
  }

  // Prepare nordic:
  // TODO Replace with "Application defined filter parameter" where it is used (Sägenkartan)
  let nordic = '';
  if (window.applicationSettings) {
    if (window.applicationSettings.includeNordic) {
      nordic = '/nordic/true';
    }
  }

  return (
    <div className={`container${id ? '' : ' loading'}`}>

      <div className="container-header">
        <div className="row">
          <div className="twelve columns">
            <h1>{name || ''}</h1>
            <p>
              {
                ((birthYear && birthYear > 0) || (places?.length > 0) || birthplace)
                && `${l('Föddes')}`
              }
              {
                birthYear && birthYear > 0 ? ` ${birthYear}` : ''
              }
              {
                ((places?.length > 0 || birthplace) ? ' i ' : '')
              }
              {
                (
                  places?.length > 0
                  && <Link to={`/places/${places[0].id}${nordic}`}>{personCounty}</Link>
                ) || birthplace
              }
            </p>
          </div>
        </div>

        {
          !config.siteOptions.hideContactButton
          && (
            <FeedbackButton
              title={name || ''}
              type="Person"
              location={location}
              country="sweden"
            />
          )
        }
        {
          !config.siteOptions.hideContactButton
          && <ContributeInfoButton title={name || ''} type="Person" location={location} />
        }
      </div>

      {
        places?.length > 0 && places[0].lat && places[0].lng
        && (
          <div className="row">
            <div className="twelve columns">
              <SimpleMap
                marker={{
                  lat: places[0].lat,
                  lng: places[0].lng,
                  label: places[0].name,
                }}
              />
            </div>
          </div>
        )
      }

      <div className="row">

        <div className={`${imagepath ? 'eight' : 'twelve'} columns`}>
          {
            biography
            && <p dangerouslySetInnerHTML={{ __html: biography.replace(/(?:\r\n|\r|\n)/g, '<br />') }} />
          }
        </div>
        {
          imagepath
          && (
            <div className="four columns">
              <img className="archive-image" src={(config.personImageUrl || config.imageUrl) + imagepath} alt="" />
            </div>
          )
        }

      </div>

      <hr />

      <div className="row">

        <div className="twelve columns">
          <h3>{l(`Arkivmaterial upptecknad av ${name}`)}</h3>
          <RecordList
            disableRouterPagination
            disableAutoFetch
            params={{
              person_id: id,
              has_untranscribed_records: mode === 'transcribe' ? 'true' : null,
              transcriptionstatus: mode === 'transcribe' ? null : 'published,accession,readytocontribute',
            }}
            mode={mode}
            hasFilter={mode !== 'transcribe'}
          />
        </div>
      </div>

    </div>
  );
}

PersonView.propTypes = {
  mode: PropTypes.string,
};
