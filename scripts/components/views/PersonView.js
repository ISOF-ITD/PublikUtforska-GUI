import { useEffect } from 'react';
import { useLoaderData, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import SimpleMap from './SimpleMap';
import RecordList from './RecordList';
import ContributeInfoButton from '../../../ISOF-React-modules/components/views/ContributeInfoButton';
import FeedbackButton from '../../../ISOF-React-modules/components/views/FeedbackButton';

import config from '../../config';

export default function PersonView({ mode }) {
  PersonView.propTypes = {
    mode: PropTypes.string,
  };
  PersonView.defaultProps = {
    mode: 'material',
  };

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
            <h2>{name || ''}</h2>
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
                  && <a href={`#/places/${places[0].id}${nordic}`}>{personCounty}</a>
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
          && <ContributeInfoButton title={name || ''} type="Person" />
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
            params={{ person_id: id }}
            mode={mode}
          />
        </div>
      </div>

    </div>
  );
}
