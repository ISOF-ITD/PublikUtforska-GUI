import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder, faFolderOpen, faFileLines, faVolumeHigh,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import ListPlayButton from './ListPlayButton';
import TranscribeButton from './TranscribeButton';
import HighlightedText from '../HighlightedText';

import config from '../../config';
import { l } from '../../lang/Lang';

import { createSearchRoute, createParamsFromSearchRoute } from '../../utils/routeHelper';
import {
  pageFromTo, getTitle, makeArchiveIdHumanReadable, getPlaceString,
} from '../../utils/helpers';

import RecordsCollection from '../collections/RecordsCollection';

import PdfGif from '../../../img/pdf.gif';

export default function RecordListItem({
  id,
  item: {
    _source: {
      archive,
      contents,
      id: recordId,
      materialtype,
      media,
      metadata,
      persons,
      places,
      recordtype,
      taxonomy,
      text,
      title,
      transcribedby,
      transcriptionstatus,
      transcriptiontype,
      year,
    },
    highlight,
  },
  searchParams,
  // useRouteParams: use the route params instead of the search params for the link
  // maybe this should be the default behaviour and search params via props should be optional?
  useRouteParams,
  archiveIdClick,
  columns,
  shouldRenderColumn,
  highlightRecordsWithMetadataField,
  mode,
  smallTitle,
}) {
  RecordListItem.propTypes = {
    id: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
    searchParams: PropTypes.object.isRequired,
    archiveIdClick: PropTypes.func.isRequired,
    columns: PropTypes.array,
    shouldRenderColumn: PropTypes.func.isRequired,
    highlightRecordsWithMetadataField: PropTypes.string,
    mode: PropTypes.string,
    useRouteParams: PropTypes.bool,
    smallTitle: PropTypes.bool,
  };

  RecordListItem.defaultProps = {
    highlightRecordsWithMetadataField: null,
    mode: 'material',
    columns: null,
    useRouteParams: false,
    smallTitle: false,
  };

  const [subrecords, setSubrecords] = useState([]);
  const [fetchedSubrecords, setFetchedSubrecords] = useState(false);
  const [visibleSubrecords, setVisibleSubrecords] = useState(false);
  const [numberOfSubrecords, setNumberOfSubrecords] = useState(0);
  const [numberOfTranscribedSubrecords, setNumberOfTranscribedSubrecords] = useState(0);

  const navigate = useNavigate();
  const params = useParams();

  // used for fetching number of subrecords and transcribed subrecords
  // after the component has mounted
  // is called in the useEffect hook below
  const fetchRecordCount = async (functionScopeParams, setValue) => {
    try {
      const queryParams = { ...config.requiredParams, ...functionScopeParams };
      const queryParamsString = Object.entries(queryParams)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      const response = await fetch(`${config.apiUrl}count?${queryParamsString}`);
      if (response.ok) {
        const json = await response.json();
        setValue(json.data.value);
      } else {
        throw new Error('Fel vid hämtning av antal uppteckningar');
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (recordtype === 'one_accession_row') {
      const oneRecordParams = {
        search: id,
        recordtype: 'one_record',
      };
      const transcribedOneRecordParams = {
        search: id,
        recordtype: 'one_record',
        transcriptionstatus: 'published,transcribed',
      };
      fetchRecordCount(oneRecordParams, setNumberOfSubrecords);
      fetchRecordCount(transcribedOneRecordParams, setNumberOfTranscribedSubrecords);
    }
  }, []);

  const collections = new RecordsCollection((json) => {
    setSubrecords(json.data);
  });

  const fetchData = () => {
    setFetchedSubrecords(true);

    const fetchParams = {
      search: id,
      recordtype: 'one_record',
    };

    collections.fetch(fetchParams);
  };

  const toggleSubrecords = () => {
    setVisibleSubrecords(!visibleSubrecords);
    if (!fetchedSubrecords) {
      fetchData();
    }
  };

  const renderFieldArchiveId = () => {
    // If one_accession_row
    if (recordtype === 'one_accession_row') {
      return (
        <td className="table-buttons" data-title={`${l('Arkivnummer')}:`}>
          <span>
            {makeArchiveIdHumanReadable(archive.archive_id)}
            {
              archive.page && (`:${archive.page}`)
            }
          </span>
        </td>
      );
    }
    // If one_record
    if (recordtype === 'one_record') {
      return (
        <td className="table-buttons" data-title={`${l('Arkivnummer')}:`}>
          <span style={{ whiteSpace: 'nowrap' }}>
            <a
              data-archiveidrow={archive.archive_id_row}
              data-search={searchParams.search ? searchParams.search : ''}
              data-recordtype={searchParams.recordtype} // === 'one_accession_row' ? 'one_record' : 'one_accession_row'}
              onClick={archiveIdClick}
              title={`Gå till accessionen ${archive.archive_id_row}`}
              style={{ cursor: archive.archive_id_row ? 'pointer' : 'inherit' }}
            >
              {makeArchiveIdHumanReadable(archive.archive_id)}
            </a>
            {
              archive.page && (`:${pageFromTo({ _source: { archive } })}`)
            }
          </span>
        </td>
      );
    }
    // If EVERYTHING ELSE
    return (
      <td className="table-buttons" data-title={`${l('Arkivnummer')}:`}>
        <span style={{ whiteSpace: 'nowrap' }}>
          <a
            data-archiveid={archive.archive_id}
            data-recordtype={searchParams.recordtype === 'one_accession_row' ? 'one_record' : 'one_accession_row'}
            onClick={archiveIdClick}
            title={`Gå till ${searchParams.recordtype === 'one_accession_row' ? 'uppteckningarna' : 'accessionerna'}`}
            style={{ cursor: 'pointer' }}
          >
            {makeArchiveIdHumanReadable(archive.archive_id)}
          </a>
          {
            archive.page && (`:${archive.page}`)
          }
        </span>
      </td>
    );
  };

  if (config.siteOptions.recordList && config.siteOptions.recordList.displayPlayButton) {
    var audioItem = media.find((mediaItem) => mediaItem.type === 'audio');
  }

  const subrecordsElement = (
    <div className="subrecords">
      {fetchedSubrecords && visibleSubrecords

        ? (
          <small>
            <a onClick={toggleSubrecords}>
              <FontAwesomeIcon icon={faFolderOpen} />
              {' '}
              Uppteckningar i den här accessionen (
              {numberOfSubrecords}
              ):
            </a>
          </small>
        )
        : (
          <small>
            <a onClick={toggleSubrecords}>
              <FontAwesomeIcon icon={faFolder} />
              {' '}
              Visa uppteckningar (
              {numberOfSubrecords}
              )
            </a>
          </small>
        )}
      {
        visibleSubrecords && (
          <ul>
            {subrecords.sort((a, b) => ((parseInt(a._source.archive.page, 10) > parseInt(b._source.archive.page, 10)) ? 1 : -1)).map((subItem, index) => {
              const published = subItem._source.transcriptionstatus === 'published';
              return (
                <li key={`subitem${subItem._source.id}`}>
                  <small>
                    <a
                      style={{ fontWeight: published ? 'bold' : '' }}
                      href={`#${mode === 'transcribe' ? '/transcribe' : ''}/records/${subItem._source.id}${createSearchRoute(
                        {
                          search: searchParams.search,
                          search_field: searchParams.search_field,
                        },
                      )}`}
                    >
                      Sida
                      {' '}
                      {pageFromTo(subItem)}
                      {/* {published && `: ${subItem._source.title}`} */}
                      {/* if published, show the title, if not published,
                    but title exists, show title but add "ej transkriberad"
                    in brackets after the title */}
                      {published && `: ${subItem._source.title}`}
                      {!published && subItem._source.title && `: ${subItem._source.title} (ej avskriven)`}
                    </a>
                  </small>

                </li>
              );
            })}
          </ul>
        )
      }
    </div>
  );

  let displayTextSummary = false;
  if (highlightRecordsWithMetadataField) {
    if (metadata.some((meta) => meta.type === highlightRecordsWithMetadataField)) {
      displayTextSummary = true;
      var textSummary = text ? (text.length > 300 ? `${text.slice(0, 300)}...` : text) : '';
    }
  }

  let taxonomyElement;
  if (taxonomy) {
    if (config.siteOptions.recordList && config.siteOptions.recordList.visibleCategories) {
      var { visibleCategories } = config.siteOptions.recordList;
    }
    if (taxonomy.name) {
      if (visibleCategories) {
        if (visibleCategories.indexOf(taxonomy.type.toLowerCase()) > -1) {
          // taxonomyElement = <a href={`#/places/category/${taxonomy.category.toLowerCase()}${routeParams ? routeParams.replace(/category\/[^/]+/g, '') : ''}`}>{l(taxonomy.name)}</a>;
          // remove link to category
          taxonomyElement = l(taxonomy.name);
        }
      } else {
        // taxonomyElement = <a href={`#/places/category/${taxonomy.category.toLowerCase()}${routeParams ? routeParams.replace(/category\/[^/]+/g, '') : ''}`}>{l(taxonomy.name)}</a>;
        // remove link to category
        taxonomyElement = l(taxonomy.name);
      }
    } else if (taxonomy.length > 0 && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideCategories === true)) {
      const taxonomyElement = taxonomy.map((taxonomyItem, i) => {
        if (taxonomyItem.category) {
          if (visibleCategories) {
            if (visibleCategories.includes(taxonomyItem.type.toLowerCase())) {
              // remove link to category
              return <span className="category" key={`record-list-item-${id}-${i}`}>{l(taxonomyItem.name)}</span>;
            }
          } else {
            // remove link to category
            return <span className="category" key={`record-list-item-${id}-${i}`}>{l(taxonomyItem.name)}</span>;
          }
        }
        return null;
      }).filter(Boolean); // Remove empty elements
    }
  }

  let collectorPersonElement;
  if (persons) {
    if (config?.siteOptions?.recordList?.visibleCollecorPersons === true) {
      if (persons.length > 0) {
        collectorPersonElement = persons
          .map((collectorPersonItem) => {
            if (['c', 'collector', 'interviewer', 'recorder'].includes(collectorPersonItem.relation)) {
              const collectorParams = { ...searchParams, page: undefined };
              const href = `#${mode === 'transcribe' ? '/transcribe' : ''
              }/persons/${collectorPersonItem.id.toLowerCase()}${createSearchRoute({
                search: collectorParams.search,
                search_field: collectorParams.search_field,
              })}`;
              return (
                <a href={href} key={`record-list-item-${id}-${collectorPersonItem.id}`}>
                  {l(collectorPersonItem.name)}
                </a>
              );
            }
            return null;
          })
          .filter(Boolean); // Remove empty elements
      }
    }
  }

  const transcribedByElement = (transcribedby
    ? (
      <span className="transcribed-by">
        {transcribedby}
      </span>
    ) : ''
  );

  // Prepare transcriptionStatus
  // var transcriptionStatusArr = {'untranscribed':'Ej transkribera', 'readytotranscribe':'<span style="color:red"> Ej avskriven <span style="color:red">', 'transcribed':'Under granskning', 'reviewing':'Under granskning', 'approved':'Avskriven','published':'Avskriven'};
  const transcriptionStatuses = {
    untranscribed: '',
    nottranscribable: '',
    readytotranscribe: 'Nej',
    undertranscription: 'Skrivs av',
    transcribed: 'Granskas',
    reviewing: 'Granskas',
    needsimprovement: 'Granskas',
    approved: 'Granskas',
    published: 'Avskriven',
  };
  let transcriptionStatusElement = <span className="transcriptionstatus empty" />;
  if (transcriptionstatus && transcriptionstatus !== 'accession') {
    transcriptionStatusElement = <span className={`transcriptionstatus ${transcriptionstatus}`}>{transcriptionstatus.replace(transcriptionstatus, transcriptionStatuses[transcriptionstatus])}</span>;
  } else if (transcriptionstatus === 'accession' && numberOfSubrecords && Number.isInteger(numberOfTranscribedSubrecords)) {
    const transcribedPercent = numberOfSubrecords === 0 ? 0 : Math.round(numberOfTranscribedSubrecords / numberOfSubrecords * 100);
    transcriptionStatusElement = (
      <div style={{ marginRight: 10 }}>
        {`${numberOfTranscribedSubrecords} av ${numberOfSubrecords}`}
        <br />
        <div
          title={`${transcribedPercent}%`}
          style={{
            display: numberOfSubrecords === 0 ? 'none' : 'inline-block',
            width: '100%',
            maxWidth: 200,
            backgroundColor: '#fff',
            height: 10,
            border: '1px solid #01535d',
            borderRadius: 3,
          }}
        >
          <span style={{
            width: `${transcribedPercent}%`,
            display: 'block',
            background: '#01535d',
            height: 10,
          }}
          />
        </div>
      </div>
    );
  }

  // Prepare title
  let titleText;
  if (transcriptionStatusElement === 'Granskas') {
    titleText = 'Titel granskas';
  } else if (transcriptionstatus === 'readytotranscribe') {
    titleText = '';
    // if there is a title, write it
    if (title) {
      titleText = getTitle(title, contents);
    }
  } else {
    titleText = getTitle(title, contents);
  }

  // const record_href = `${config.embeddedApp ? (window.applicationSettings && window.applicationSettings.landingPage ? window.applicationSettings.landingPage : config.siteUrl) : ''
  // 	 }#/records/${this.props.id
  // 	 }${createSearchRoute(searchParams)}`;
  const recordHref = `#${mode === 'transcribe' ? '/transcribe' : ''}/records/${id}${createSearchRoute(
    useRouteParams
      ? createParamsFromSearchRoute(params['*'])
      : {
        category: searchParams.category,
        search: searchParams.search,
        search_field: searchParams.search_field,
      },
  )}`;

  return (
    <tr className={`list-item${displayTextSummary ? ' highlighted' : ''}`}>
      {
        shouldRenderColumn('title', columns)
        && (
          <td className={smallTitle ? 'table-buttons' : 'text-larger'}>
            <a className="item-title" target={config.embeddedApp ? '_parent' : '_self'} href={recordHref}>
              {
                config.siteOptions.recordList && config.siteOptions.recordList.displayPlayButton && audioItem != undefined
                && <ListPlayButton disablePlayback media={audioItem} recordId={recordId} recordTitle={title && title != '' ? title : l('(Utan titel)')} />
              }
              {
                media?.filter((m) => m.source && m.source.toLowerCase().includes('.pdf'))[0]
                && <sub><img src={PdfGif} style={{ marginRight: 5 }} alt="pdf" title="Accession" /></sub>
              }
              {
                media?.filter((m) => m.source && m.source.toLowerCase().includes('.jpg'))[0]
                && <FontAwesomeIcon icon={faFileLines} style={{ marginRight: 5 }} alt="jpg" title="Uppteckning" />
              }
              {
                media?.filter((m) => m.source && m.source.toLowerCase().includes('.mp3'))[0]
                && <FontAwesomeIcon icon={faVolumeHigh} style={{ marginRight: 5 }} alt="jpg" title="Inspelning" />
              }
              {titleText && titleText !== '[]' ? titleText : ''}
            </a>
            {
              displayTextSummary
              && <div className="item-summary">{textSummary}</div>
            }
            {
              highlight?.text?.[0] && <HighlightedText text={highlight.text[0]} surroundingCharsForHighlights={60} />
            }

            {recordtype === 'one_accession_row' && numberOfSubrecords !== 0 && subrecordsElement}
            {transcriptionstatus === 'readytotranscribe' && media.length > 0
              && (
                <TranscribeButton
                  className="button button-primary"
                  label={l('Skriv av')}
                  title={title}
                  recordId={recordId}
                  archiveId={archive.archive_id}
                  places={places}
                  images={media}
                  transcriptionType={transcriptiontype}
                  random={false}
                />
              )}
          </td>
        )
      }
      {
        shouldRenderColumn('archive_id', columns) && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideAccessionpage === true)
        && renderFieldArchiveId()
      }
      {
        // shouldRenderColumn('category', columns) && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideCategories === true && searchParams.recordtype !== 'one_accession_row')
        // && (
        //   <td className="table-buttons" data-title={`${l('Kategori')}:`}>
        //     {
        //       taxonomyElement
        //     }
        //   </td>
        // )
      }
      {
        shouldRenderColumn('place', columns)
        && (
          <td className="table-buttons" data-title={`${l('Ort')}:`}>
            {
              places && places.length > 0
              && (
                <a
                  target={config.embeddedApp ? '_parent' : '_self'}
                  href={`#${mode === 'transcribe' ? '/transcribe' : ''}/places/${places[0].id}${createSearchRoute(
                    {
                      category: searchParams.category,
                      search: searchParams.search,
                      search_field: searchParams.search_field,
                    },
                  )}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/places/${places[0].id}`);
                  }}
                >
                  {
                    getPlaceString(places)
                  }
                </a>
              )
            }
          </td>
        )
      }
      {
        shouldRenderColumn('collector', columns) && (!config.siteOptions.recordList || config.siteOptions.recordList.visibleCollecorPersons === true)
        && (
          <td className="table-buttons" data-title={`${l('Insamlare')}:`}>
            {
              collectorPersonElement
            }
          </td>
        )
      }
      {
        shouldRenderColumn('year', columns)
        && (
          <td className="table-buttons" data-title={`${l('År')}:`}>
            <span className="year">{year ? year.split('-')[0] : ''}</span>
          </td>
        )
      }
      {
        shouldRenderColumn('material_type', columns) && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideMaterialType === true)
        && <td data-title={`${l('Materialtyp')}:`}>{materialtype}</td>
        // <td data-title={l('Avskriven')+':'}>{transcriptionstatus ? transcriptionstatus : ''}</td>
      }
      {
        shouldRenderColumn('transcription_status', columns)
        && (
          <td data-title={`${l('Avskriven')}:`} className="table-buttons">
            {transcriptionStatusElement}
          </td>
        )
      }
      {
        // Den här kolumnen måste explicit läggas till i props.columns (används bara för "senast avskrivna" på sidmenyn)

        columns && columns.indexOf('transcribedby') > -1
        && (
          <td data-title={`${l('Transkriberad av')}:`}>
            {transcribedByElement}
          </td>
        )
      }
    </tr>
  );
}
