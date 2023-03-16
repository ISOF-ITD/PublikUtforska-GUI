import { useState } from 'react';
import _ from 'underscore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { Navigate, useNavigate } from 'react-router-dom';
import ListPlayButton from '../../../ISOF-React-modules/components/views/ListPlayButton';
import TranscribeButton from '../../../ISOF-React-modules/components/views/TranscribeButton';

import config from '../../config';

import routeHelper, {createSearchRoute} from '../../utils/routeHelper';
import { pageFromTo, getTitle, makeArchiveIdHumanReadable } from '../../utils/helpers';
import { getPlaceString } from '../../../ISOF-React-modules/components/utils/helpers';

import RecordsCollection from '../../../ISOF-React-modules/components/collections/RecordsCollection';

import PdfGif from '../../../img/pdf.gif';

import PropTypes from 'prop-types';

export default function RecordListItem({
  id,
  item,
  searchParams,
  archiveIdClick,
  columns,
  shouldRenderColumn,
  highlightRecordsWithMetadataField,
  routeParams,
  mode,
}) {
  RecordListItem.propTypes = {
    id: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
    searchParams: PropTypes.object.isRequired,
    archiveIdClick: PropTypes.func.isRequired,
    columns: PropTypes.array.isRequired,
    shouldRenderColumn: PropTypes.func.isRequired,
    highlightRecordsWithMetadataField: PropTypes.string,
    routeParams: PropTypes.object,
    mode: PropTypes.string,
  };

  RecordListItem.defaultProps = {
    highlightRecordsWithMetadataField: null,
    routeParams: {},
    mode: 'material',
  };

  const [subrecords, setSubrecords] = useState([]);
  const [fetchedSubrecords, setFetchedSubrecords] = useState(false);

  const navigate = useNavigate();

  const collections = new RecordsCollection((json) => {
    if (!json.data || json.data.length === 0) {
      // Om vi hittade inga postar skickar vi visuell meddelande till användaren
      if (window.eventBus) {
        window.eventBus.dispatch('popup-notification.notify', null, l('Inga sökträffar'));
      }
    }
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

  const renderFieldArchiveId = () => {
    // If one_accession_row
    if (item._source.recordtype === 'one_accession_row') {
      return (
        <td className="table-buttons" data-title={`${l('Arkivnummer')}:`}>
          <span>
            {makeArchiveIdHumanReadable(item._source.archive.archive_id)}
            {
              item._source.archive.page && (`:${item._source.archive.page}`)
            }
          </span>
        </td>
      );
    }
    // If one_record
    if (item._source.recordtype === 'one_record') {
      return (
        <td className="table-buttons" data-title={`${l('Arkivnummer')}:`}>
          <span style={{ whiteSpace: 'nowrap' }}>
            <a
              data-archiveidrow={item._source.archive.archive_id_row}
              data-search={searchParams.search ? searchParams.search : ''}
              data-recordtype={searchParams.recordtype} // === 'one_accession_row' ? 'one_record' : 'one_accession_row'}
              onClick={archiveIdClick}
              title={`Gå till accessionen ${item._source.archive.archive_id_row}`}
              style={{ cursor: item._source.archive.archive_id_row ? 'pointer' : 'inherit' }}
            >
              {makeArchiveIdHumanReadable(item._source.archive.archive_id)}
            </a>
            {
              item._source.archive.page && (`:${pageFromTo(item)}`)
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
            data-archiveid={item._source.archive.archive_id}
            data-recordtype={searchParams.recordtype === 'one_accession_row' ? 'one_record' : 'one_accession_row'}
            onClick={archiveIdClick}
            title={`Gå till ${searchParams.recordtype === 'one_accession_row' ? 'uppteckningarna' : 'accessionerna'}`}
            style={{ cursor: 'pointer' }}
          >
            {makeArchiveIdHumanReadable(item._source.archive.archive_id)}
          </a>
          {
            item._source.archive.page && (`:${item._source.archive.page}`)
          }
        </span>
      </td>
    );
  };

  if (config.siteOptions.recordList && config.siteOptions.recordList.displayPlayButton) {
    var audioItem = _.find(item._source.media, (item) => item.type === 'audio');
  }

  const subrecordsElement = (
    <div className="subrecords">
      {fetchedSubrecords === false

        ? (
          <small>
            <a onClick={fetchData}>
              <FontAwesomeIcon icon={faFolder} />
              {' '}
              Visa uppteckningar (
              {item._source.numberofonerecord}
              )
            </a>
          </small>
        )
        : (
          <small>
            <FontAwesomeIcon icon={faFolderOpen} />
            {' '}
            Uppteckningar i den här accessionen (
            {item._source.numberofonerecord}
            ):
          </small>
        )}
      <ul>
        {subrecords.sort((a, b) => ((parseInt(a._source.archive.page) > parseInt(b._source.archive.page)) ? 1 : -1)).map((item, index) => {
          const published = item._source.transcriptionstatus === 'published';
          return (
            <li key={`subitem${item._source.id}`}>
              <small>
                <a style={{ fontWeight: published ? 'bold' : '' }} href={`#${mode === 'transcribe' ? '/transcribe' : ''}/records/${item._source.id}${createSearchRoute(searchParams)}`}>
                  Sida
                  {pageFromTo(item)}
                  {published && `: ${item._source.title}`}
                </a>
              </small>

            </li>
          );
        })}
      </ul>
    </div>
  );

  let displayTextSummary = false;
  if (highlightRecordsWithMetadataField) {
    if (_.findWhere(item._source.metadata, { type: highlightRecordsWithMetadataField })) {
      displayTextSummary = true;
      var textSummary = item._source.text ? (item._source.text.length > 300 ? `${item._source.text.substr(0, 300)}...` : item._source.text) : '';
    }
  }

  let taxonomyElement;
  if (item._source.taxonomy) {
    if (config.siteOptions.recordList && config.siteOptions.recordList.visibleCategories) {
      var { visibleCategories } = config.siteOptions.recordList;
    }
    if (item._source.taxonomy.name) {
      if (visibleCategories) {
        if (visibleCategories.indexOf(item._source.taxonomy.type.toLowerCase()) > -1) {
          taxonomyElement = <a href={`#/places/category/${item._source.taxonomy.category.toLowerCase()}${routeParams ? routeParams.replace(/category\/[^/]+/g, '') : ''}`}>{l(item._source.taxonomy.name)}</a>;
        }
      } else {
        taxonomyElement = <a href={`#/places/category/${item._source.taxonomy.category.toLowerCase()}${routeParams ? routeParams.replace(/category\/[^/]+/g, '') : ''}`}>{l(item._source.taxonomy.name)}</a>;
      }
    } else if (item._source.taxonomy.length > 0 && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideCategories === true)) {
      taxonomyElement = _.compact(_.map(item._source.taxonomy, (taxonomyItem, i) => {
        if (taxonomyItem.category) {
          const href = `#/places${createSearchRoute({
            category: taxonomyItem.category.toLowerCase(),
            recordtype: searchParams.recordtype,
          })}`;
          if (visibleCategories) {
            if (visibleCategories.indexOf(taxonomyItem.type.toLowerCase()) > -1) {
              return <a href={href} key={`record-list-item-${id}-${i}`}>{l(taxonomyItem.name)}</a>;
            }
          } else {
            return <a href={href}>{l(taxonomyItem.name)}</a>;
          }
        }
      }));
    }
  }

  let collectorPersonElement;
  if (item._source.persons) {
    if (config.siteOptions.recordList && config.siteOptions.recordList.visibleCollecorPersons === true) {
      if (item._source.persons.length > 0) {
        collectorPersonElement = _.compact(_.map(item._source.persons, (collectorPersonItem, i) => {
          if (collectorPersonItem.relation === 'c') {
            let routeParams = '';
            if (routeParams) {
              const _params = routeHelper.createParamsFromSearchRoute(routeParams);
              routeParams = createSearchRoute(_.omit(_params, 'page'));
            }
            const href = `#/person/${collectorPersonItem.id.toLowerCase()}${routeParams}`;
            return <a href={href} key={`record-list-item-${id}-${i}`}>{l(collectorPersonItem.name)}</a>;
          }
          return '';
        }));
      }
    }
  }

  const transcribedByElement = (item._source.transcribedby
    ? (
      <span className="transcribed-by">
        {item._source.transcribedby}
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
  if (item._source.transcriptionstatus && item._source.transcriptionstatus !== 'accession') {
    const { transcriptionstatus } = item._source;
    transcriptionStatusElement = <span className={`transcriptionstatus ${transcriptionstatus}`}>{transcriptionstatus.replace(transcriptionstatus, transcriptionStatuses[transcriptionstatus])}</span>;
  } else if (item._source.transcriptionstatus === 'accession' && item._source.numberofonerecord && Number.isInteger(item._source.numberoftranscribedonerecord)) {
    const transcribedPercent = item._source.numberofonerecord === 0 ? 0 : Math.round(item._source.numberoftranscribedonerecord / item._source.numberofonerecord * 100);
    transcriptionStatusElement = (
      <div style={{ marginRight: 10 }}>
        {`${item._source.numberoftranscribedonerecord} av ${item._source.numberofonerecord}`}
        <br />
        <div
          title={`${transcribedPercent}%`}
          style={{
            display: item._source.numberofonerecord === 0 ? 'none' : 'inline-block',
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
  } else if (item._source.transcriptionstatus === 'readytotranscribe') {
    titleText = 'Ej avskriven';
  } else {
    titleText = getTitle(item._source.title, item._source.contents);
  }

  // const record_href = `${config.embeddedApp ? (window.applicationSettings && window.applicationSettings.landingPage ? window.applicationSettings.landingPage : config.siteUrl) : ''
  // 	 }#/records/${this.props.id
  // 	 }${createSearchRoute(searchParams)}`;
  const record_href = `#${mode === 'transcribe' ? '/transcribe' : ''}/records/${id}`;

  return (
    <tr className={`list-item${displayTextSummary ? ' highlighted' : ''}`}>
      {
        shouldRenderColumn('title', columns)
        && (
          <td className="text-larger">
            <a className="item-title" target={config.embeddedApp ? '_parent' : '_self'} href={record_href}>
              {
                config.siteOptions.recordList && config.siteOptions.recordList.displayPlayButton && audioItem != undefined
                && <ListPlayButton disablePlayback media={audioItem} recordId={item._source.id} recordTitle={item._source.title && item._source.title != '' ? item._source.title : l('(Utan titel)')} />
              }
              {titleText && titleText != '' && titleText != '[]' ? titleText : l('(Utan titel)')}
              {
                item._source.media && item._source.media.filter((m) => m.source && m.source.includes('.pdf'))[0]
                && <sub><img src={PdfGif} style={{ marginLeft: 5 }} /></sub>
              }
            </a>
            {
              displayTextSummary
              && <div className="item-summary">{textSummary}</div>
            }
            {item._source.recordtype === 'one_accession_row' && item._source.numberofonerecord !== 0 && subrecordsElement}
            {item._source.transcriptionstatus === 'readytotranscribe' && item._source.media.length > 0
              && (
                <TranscribeButton
                  className="button-primary"
                  label={l('Skriv av')}
                  title={item._source.title}
                  recordId={item._source.id}
                  archiveId={item._source.archive.archive_id}
                  places={item._source.places}
                  images={item._source.media}
                  transcriptionType={item._source.transcriptiontype}
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
        shouldRenderColumn('category', columns) && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideCategories === true && searchParams.recordtype !== 'one_accession_row')
        && (
          <td className="table-buttons" data-title={`${l('Kategori')}:`}>
            {
              taxonomyElement
            }
          </td>
        )
      }
      {
        shouldRenderColumn('place', columns)
        && (
          <td className="table-buttons" data-title={`${l('Ort')}:`}>
            {
              item._source.places && item._source.places.length > 0
              && (
                <a
                  target={config.embeddedApp ? '_parent' : '_self'}
                  href={`${config.embeddedApp ? (window.applicationSettings && window.applicationSettings.landingPage ? window.applicationSettings.landingPage : config.siteUrl) : ''}#${mode === 'transcribe' ? '/transcribe' : ''}/places/${item._source.places[0].id}${createSearchRoute({ recordtype: searchParams.recordtype })}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/places/${item._source.places[0].id}${createSearchRoute({ recordtype: searchParams.recordtype })}`);
                  }}
                >
                  {
                    getPlaceString(item._source.places)
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
            <span className="year">{item._source.year ? item._source.year.split('-')[0] : ''}</span>
          </td>
        )
      }
      {
        shouldRenderColumn('material_type', columns) && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideMaterialType === true)
        && <td data-title={`${l('Materialtyp')}:`}>{item._source.materialtype}</td>
        // <td data-title={l('Avskriftstatus')+':'}>{item._source.transcriptionstatus ? item._source.transcriptionstatus : ''}</td>
      }
      {
        shouldRenderColumn('transcription_status', columns)
        && (
          <td data-title={`${l('Avskriftstatus')}:`} className="table-buttons">
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
