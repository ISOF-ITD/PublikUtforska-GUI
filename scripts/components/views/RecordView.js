import { useState, useEffect } from 'react';
import {
  useNavigate, useLocation, useParams, useLoaderData,
} from 'react-router-dom';
import PropTypes from 'prop-types';

import config from '../../config';
// import localLibrary from '../../utils/localLibrary';

import ShareButtons from '../ShareButtons';
import SimpleMap from './SimpleMap';

import ContributeInfoButton from './ContributeInfoButton';
import FeedbackButton from './FeedbackButton';

// import ElementNotificationMessage from '../ElementNotificationMessage';

import { createSearchRoute, createParamsFromRecordRoute } from '../../utils/routeHelper';
import {
  getTitle, makeArchiveIdHumanReadable, getArchiveName,
} from '../../utils/helpers';

import RecordsCollection from '../collections/RecordsCollection';

import archiveLogoIsof from '../../../img/archive-logo-isof.png';
import archiveLogoIkos from '../../../img/archive-logo-ikos.png';

import { l } from '../../lang/Lang';
import RecordList from './RecordList'
import RecordViewContent from './RecordViewContent';

export default function RecordView({ mode, openSwitcherHelptext }) {
  RecordView.propTypes = {
    mode: PropTypes.string,
    openSwitcherHelptext: PropTypes.func.isRequired,
  };

  RecordView.defaultProps = {
    mode: 'material',
  };

  const params = useParams();
  const navigate = useNavigate();

  // const [saved, setSaved] = useState(false);
  const [subrecords, setSubrecords] = useState([]);



  const location = useLocation();

  const loaderData = useLoaderData();
  // the data is either in the _source property (if we used getRecordFetchLocation)
  // or in the data property (if we used getRecordsFetchLocation)
  // see app.js
  const data = loaderData[0]?.data?.[0]?._source || loaderData[1]?._source || loaderData[0]?._source;
  const highlightedText = loaderData[0]?.data?.[0]?.highlight?.text?.[0];

  const collections = new RecordsCollection((json) => {
    setSubrecords(json.data);
  });

  const fetchSubrecords = () => {
    const fetchParams = {
      search: data.archive.archive_id_row,
      recordtype: 'one_record',
    };
    collections.fetch(fetchParams);
  };

  useEffect(() => {
    // fetchData(params);
    if (data.archive) {
      fetchSubrecords();
    }
    // if the component receives the "sent" signal from overlay.transcribe,
    // it should fetch the subrecords again
    const { eventBus } = window;
    // TODO: den följande logiken borde ligga i RecordList componenten. oklart varför det ens funkar här
    // den ska ladda om listan med subrecords när en transkription har skickats
    if (eventBus) {
      eventBus.addEventListener('overlay.transcribe.sent', () => {
        // first, wait 500ms before fetching subrecords again
        setTimeout(
          () => {
            fetchSubrecords();
          },
          3000,
        );
        // then, wait 5 seconds before fetching subrecords again.
        // this is to give elasticsearch time to index the new transcription
        setTimeout(
          () => {
            fetchSubrecords();
          },
          10000,
        );
      });
    }
    // on unnount, set the document title back to the site title
    return () => {
      document.title = config.siteTitle;
    };
  }, []);

  useEffect(() => {
    if (data.archive && data.archive.archive_id_row) {
      fetchSubrecords();
    }
  }, [data.archive]);

  const archiveIdClick = (e) => {
    e.preventDefault();
    const archiveIdRow = e.target.dataset.archiveidrow;
    const { recordtype } = e.target.dataset;
    const { search } = e.target.dataset;
    const localparams = {
      search,
      recordtype,
    };
    if (archiveIdRow) {
      navigate(`/records/${archiveIdRow}${createSearchRoute(localparams)}`);
    }
  };

  const getArchiveLogo = (archive) => {
    const archiveLogos = {};

    archiveLogos['Dialekt-, namn- och folkminnesarkivet i Göteborg'] = archiveLogoIsof;
    archiveLogos['Dialekt- och folkminnesarkivet i Uppsala'] = archiveLogoIsof;
    archiveLogos['Dialekt och folkminnesarkivet i Uppsala'] = archiveLogoIsof;
    archiveLogos.DAG = 'img/archive-logo-isof.png';
    // Needs to be shrinked. By css?
    // archiveLogos['Norsk folkeminnesamling'] = 'img/UiO_Segl_A.png';
    archiveLogos['Norsk folkeminnesamling'] = archiveLogoIkos;
    archiveLogos.NFS = archiveLogoIkos;
    archiveLogos.DFU = archiveLogoIkos;
    // archiveLogos['SLS'] = SlsLogga;
    // archiveLogos['Svenska litteratursällskapet i Finland (SLS)'] = SlsLogga;

    return (
      archiveLogos[archive]
        ? config.appUrl + archiveLogos[archive]
        : config.appUrl + archiveLogos.DAG
    );
  };


  const routeParams = createSearchRoute(
    createParamsFromRecordRoute(location.pathname),
  );

  if (data) {
    

    // Förberedar lista över personer
    // console.log('disablePersonLinks: '+config.siteOptions.disablePersonLinks)
    // console.log('disableInformantLinks: '+config.siteOptions.disableInformantLinks)
    const personItems = data.persons?.length > 0 ? data.persons.map((person) => (
      <tr key={person.id}>
        <td data-title="">
          {!config.siteOptions.disablePersonLinks && config.siteOptions.disableInformantLinks && ['i', 'informant'].includes(person.relation) && person.name}
          {!config.siteOptions.disablePersonLinks && !(config.siteOptions.disableInformantLinks && ['i', 'informant'].includes(person.relation)) && <a href={`#/persons/${person.id}${routeParams || ''}`}>{person.name ? person.name : ''}</a>}
          {config.siteOptions.disablePersonLinks && person.name}
        </td>
        <td data-title="Födelseår">{person.birth_year && person.birth_year > 0 ? person.birth_year : ''}</td>
        <td data-title="Födelseort">
          {
            person.home && person.home.length > 0
            && <a href={`#/places/${person.home[0].id}${routeParams || ''}`}>{`${person.home[0].name}, ${person.home[0].harad}`}</a>
          }
          {person.birthplace ? ` ${person.birthplace}` : ''}
        </td>
        <td data-title="Roll">
          {['c', 'collector'].includes(person.relation) && l('Insamlare')}
          {['i', 'informant'].includes(person.relation) && l('Informant')}
          {person.relation === 'excerpter' && l('Excerpist')}
          {person.relation === 'author' && l('Författare')}
          {person.relation === 'recorder' && l('Inspelad av')}
          {person.relation === 'photographer' && l('Fotograf')}
          {person.relation === 'interviewer' && l('Intervjuare')}
          {person.relation === 'mentioned' && l('Omnämnd')}
          {person.relation === 'artist' && l('Konstnär')}
          {person.relation === 'illustrator' && l('Illustratör')}
          {person.relation === 'sender' && l('Avsändare')}
          {person.relation === 'receiver' && l('Mottagare')}
        </td>
      </tr>
    )) : [];

    // Förbereder lista över socknar
    const placeItems = data.places && data.places.length > 0 ? data.places.map((place) => (
      <tr key={place.id}>
        <td><a href={`#/places/${place.id}${routeParams || ''}`}>{`${place.name}, ${place.fylke ? place.fylke : place.harad}`}</a></td>
      </tr>
    )) : [];


    // Förbereder kategori länk
    let taxonomyElement;

    // Prepares country for this record
    let country = 'unknown';
    if ('archive' in data && 'country' in data.archive) {
      country = data.archive.country;
    }

    // Förbereder metadata items. siteOptions i config bestämmer vilken typ av metadata ska synas
    const metadataItems = [];

    const getMetadataTitle = (item) => (
      config.siteOptions.metadataLabels?.[item] ?? item
    );

    if (data.metadata?.length && config.siteOptions.recordView?.visible_metadata_fields?.length) {
      let itemCount = 0;
      data.metadata.forEach((item) => {
        if (config.siteOptions.recordView.visible_metadata_fields.indexOf(item.type) > -1) {
          itemCount += 1;
          metadataItems.push(
            <div className="grid-item" key={item.type}>
              <p>
                <strong>{getMetadataTitle(item.type)}</strong>
                <br />
                {item.value}
              </p>
            </div>,
          );

          if (itemCount % 3 === 0) {
            metadataItems.push(<div className="grid-divider-3 u-cf" key={`cf-${item.value}`} />);
          }

          if (itemCount % 2 === 0) {
            metadataItems.push(<div className="grid-divider-2 u-cf" key={`cf-${item.value}`} />);
          }
        }
      });
    }

    // Prepares pages
    let pages = '';
    if (data?.archive?.page) {
      pages = data.archive.page;
      // If pages is not an interval separated with '-': calculate interval
      // pages can be recorded as interval in case of pages '10a-10b'
      if (!!pages && pages.indexOf('-') === -1) {
        if (data.archive.total_pages) {
          // Remove uncommon non numeric characters in pages (like 10a) for simplicity
          if (typeof pages === 'string') {
            pages = pages.replace(/\D/g, '');
            pages = parseInt(pages, 10);
          }
          const totalPages = parseInt(data.archive.total_pages, 10);
          if (totalPages > 1) {
            let endpage = pages;
            endpage = endpage + totalPages - 1;
            pages = `${pages.toString()}-${endpage.toString()}`;
          }
        }
      }
    }

    // Prepare title
    let titleText;
    const transcriptionStatusElement = data.transcriptionstatus;
    if (['undertranscription', 'transcribed', 'reviewing', 'needsimprovement', 'approved'].includes(transcriptionStatusElement)) {
      titleText = 'Titel granskas';
    } else if (data.transcriptionstatus === 'readytotranscribe') {
      titleText = 'Ej avskriven';
      // If there is a title, use it, and put "Ej avskriven" in brackets
      if (data.title) {
        titleText = `${getTitle(data.title, data.contents)} (${titleText})`;
      }
    } else {
      titleText = getTitle(data.title, data.contents);
    }
    if (titleText) {
      document.title = `${titleText} - ${config.siteTitle}`;
    }

    return (
      <div className={`container${data.id ? '' : ' loading'}`}>

        <div className="container-header">
          <div className="row">
            <div className="twelve columns">
              <h2>
                {titleText && titleText !== '' && titleText !== '[]' ? titleText : l('(Utan titel)')}
                {' '}
                {/* favorites/save not working at the moment */}
                {/* <ElementNotificationMessage
                  placement="under"
                  placementOffsetX="-1"
                  messageId="saveLegendsNotification"
                  forgetAfterClick
                  closeTrigger="click"
                  autoHide
                  message={l('Klicka på stjärnan för att spara sägner till din egen lista.')}
                >
                  <button className={`save-button${saved ? ' saved' : ''}`} onClick={toggleSaveRecord} type="button"><span>{l('Spara')}</span></button>
                </ElementNotificationMessage> */}
              </h2>
              <p>
                {
                  data.recordtype === 'one_accession_row' && l('Accession')
                }
                {
                  data.recordtype === 'one_record' && l('Uppteckning')
                }
                <span className="switcher-help-button" onClick={openSwitcherHelptext} title="Om accessioner och uppteckningar">?</span>
              </p>
              <p>
                {

                  data.archive?.archive
                  && (
                    <span>
                      <strong>{l('Accessionsnummer')}</strong>
                      :&nbsp;
                      {
                        data.recordtype === 'one_record'
                          ? (
                            <a
                              data-archiveidrow={data.archive.archive_id_row}
                              // create state.searchParams
                              data-search={params.search || ''}
                              data-recordtype={params.recordtype}
                              onClick={archiveIdClick}
                              title={`Gå till accessionen ${data.archive.archive_id_row}`}
                              style={{ cursor: data.archive.archive_id_row ? 'pointer' : 'inherit', textDecoration: 'underline' }}
                              href={
                                `#/records/${data.archive.archive_id_row}${createSearchRoute({ search: params.search || '', recordtype: params.recordtype })}`
                              }
                            >
                              {makeArchiveIdHumanReadable(data.archive.archive_id)}
                            </a>
                          ) : makeArchiveIdHumanReadable(data.archive.archive_id)
                      }

                    </span>
                  )
                }
                {
                  data.recordtype === 'one_accession_row' && subrecords?.length
                    ? (
                      <span style={{ marginLeft: 10 }}>
                        <strong>{l('Antal uppteckningar')}</strong>
                        {`: ${subrecords.length}`}
                      </span>
                    )
                    : null
                }
                {
                  !!data.archive && !!data.archive.archive && !!pages
                  && (
                    <span style={{ marginLeft: 10 }}>
                      <strong>{l('Sidnummer')}</strong>
                      {`: ${pages}`}
                    </span>
                  )
                }
                {
                  !(config.siteOptions?.recordView?.hideMaterialType ?? false)
                  && (
                    <span style={{ marginLeft: 10 }}>
                      <strong>Materialtyp</strong>
                      :
                      {' '}
                      {data.materialtype}
                    </span>
                  )
                }
              </p>
            </div>
          </div>

          {
            !config.siteOptions.hideContactButton
            && <FeedbackButton title={data.title} type="Uppteckning" country={country} location={location} />
          }
          {
            !config.siteOptions.hideContactButton
            && <ContributeInfoButton title={data.title} type="Uppteckning" country={country} id={data.id} location={location} />
          }
        </div>

        <RecordViewContent
          data={data}
          highlightedText={highlightedText}
        />
        {
          metadataItems.length > 0
          && (
            <div className="grid-items">

              {metadataItems}

              <div className="u-cf" />

            </div>
          )
        }

        <div className="row">

          <div className="six columns">
            <ShareButtons path={`${config.siteUrl}#/records/${data.id}`} title={l('Kopiera länk')} />
          </div>

          <div className="six columns">
            {/* copies the citation to the clipboard */}
            <ShareButtons
              path={(
                `${makeArchiveIdHumanReadable(data.archive.archive_id, data.archive.archive_org)}, ${pages ? `s. ${pages}, ` : ''}${getArchiveName(data.archive.archive_org)}`
              )}
              title={l('Källhänvisning')}
            />
          </div>
        </div>
        <div className="row">
          {
            config.siteOptions && config.siteOptions.copyrightContent && data.copyrightlicense
            && (
              <div className="six columns offset-by-six">
                <div className="copyright" dangerouslySetInnerHTML={{ __html: config.siteOptions.copyrightContent[data.copyrightlicense] }} />
              </div>
            )
          }

        </div>

        <hr />

        {
          data.recordtype === 'one_accession_row'
          && subrecords.length > 0
          && (
            <div className="row">

              <div className="twelve columns">
                <h3>{l('Uppteckningar')}</h3>
                <RecordList
                  params={{
                    search: data.archive.archive_id_row,
                    recordtype: 'one_record',
                  }}
                  useRouteParams
                  mode={mode}
                  hasFilter={false}
                />

              </div>
            </div>
          )
        }

        <hr />

        {
          personItems.length > 0
          && (
            <div className="row">

              <div className="twelve columns">
                <h3>{l('Personer')}</h3>

                <div className="table-wrapper">
                  <table width="100%" className="table-responsive">
                    <thead>
                      <tr>
                        <th>{l('Namn')}</th>
                        <th>{l('Födelseår')}</th>
                        <th>{l('Födelseort')}</th>
                        <th>{l('Roll')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personItems}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )
        }
        {
          personItems.length > 0 && placeItems.length > 0
          && <hr />
        }

        {
          placeItems.length > 0
          && (
            <div className="row">

              <div className="six columns">
                <h3>{l('Platser')}</h3>

                <div className="table-wrapper">
                  <table width="100%">

                    <thead>
                      <tr>
                        <th>{l('Namn')}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {placeItems}
                    </tbody>

                  </table>
                </div>
              </div>

              <div className="six columns">
                {
                  data?.places?.[0].location.lat && data?.places?.[0].location.lon
                  && <SimpleMap markers={data.places} />
                }
              </div>

            </div>
          )
        }

        <hr />

        <div className="row">

          <div className="four columns">
            {
              data.archive && data.archive.archive
              && (
                <p>
                  <strong>{l('Arkiv')}</strong>
                  <br />
                  {getArchiveName(data.archive.archive_org)}
                </p>
              )
            }

            {
              data.archive && data.archive.archive
              && (
                <p>
                  <strong>{l('Acc. nr')}</strong>
                  <br />
                  {makeArchiveIdHumanReadable(data.archive.archive_id)}
                </p>
              )
            }

            {
              data.archive && data.archive.archive
              && (
                <p>
                  <strong>{l('Sidnummer')}</strong>
                  <br />
                  {pages}
                </p>
              )
            }
          </div>

          <div className="four columns">
            {
              data.materialtype
              && (
                <p>
                  <strong>{l('Materialtyp')}</strong>
                  <br />
                  {data.materialtype ? data.materialtype.charAt(0).toUpperCase() + data.materialtype.slice(1) : ''}
                </p>
              )
            }

            {
              taxonomyElement
            }
          </div>

          <div className="four columns">
            {
              data.year
              && (
                <p>
                  <strong>{l('År')}</strong>
                  <br />
                  {data.year.substring(0, 4)}
                </p>
              )
            }

            {
              data.source
              && (
                <p>
                  <strong>{l('Tryckt källa')}</strong>
                  <br />
                  {data.source}
                </p>
              )
            }

            {
              data.archive && data.archive.archive
              && (
                <p>
                  <img
                    src={getArchiveLogo(data.archive.archive)}
                    style={{ width: '100%' }}
                    alt={makeArchiveIdHumanReadable(data.archive.archive_id)}
                  />
                </p>
              )
            }
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="container">
      <div className="container-header">
        <div className="row">
          <div className="twelve columns">
            <h2>{l('Finns inte')}</h2>
          </div>
        </div>
      </div>

      <div className="row">
        <p>{`Post ${params.record_id} finns inte.`}</p>
      </div>
    </div>
  );
}
