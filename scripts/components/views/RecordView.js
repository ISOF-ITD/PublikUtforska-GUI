/* eslint-disable react/require-default-props */
import {
  Suspense, useState, useMemo, useEffect,
} from 'react';
import {
  Await, useLoaderData, useLocation, useNavigate, useParams,
} from 'react-router-dom';
import PropTypes from 'prop-types';
import sanitizeHtml from 'sanitize-html';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronRight,
  faArrowUpRightFromSquare,
  faLock,
  faNewspaper,
} from '@fortawesome/free-solid-svg-icons';
import { l } from '../../lang/Lang';
import {
  getTitle,
  makeArchiveIdHumanReadable,
  getAudioTitle,
  getArchiveName,
  getArchiveLogo,
  fetchRecordMediaCount,
} from '../../utils/helpers';
import config from '../../config';
import FeedbackButton from './FeedbackButton';
import ContributeInfoButton from './ContributeInfoButton';
import SitevisionContent from '../SitevisionContent';
import TranscribeButton from './transcribe/TranscribeButton';
import ListPlayButton from './ListPlayButton';
import PdfViewer from '../PdfViewer';
import ShareButtons from './RecordView/ShareButtons';
import SimpleMap from './SimpleMap';
import RecordsCollection from '../collections/RecordsCollection';
import RecordList from './RecordList';
/*
useLocation();
  const routeParams = createSearchRoute(
    createParamsFromRecordRoute(location.pathname),
  );
  */
import { createSearchRoute, createParamsFromRecordRoute } from '../../utils/routeHelper';

const openSwitcherHelptext = () => {
  if (window.eventBus) {
    window.eventBus.dispatch('overlay.switcherHelpText', {});
  }
};
function getPages(data) {
  let pages = '';

  if (data?.archive?.page) {
    pages = data.archive.page;

    // Kontrollera om 'pages' inte är ett intervall och hantera det
    if (pages && pages.indexOf('-') === -1) {
      if (data.archive.total_pages) {
        // Rensa bort icke-numeriska tecken som "10a" och gör om till siffra
        if (typeof pages === 'string') {
          pages = pages.replace(/\D/g, '');
          pages = parseInt(pages, 10);
        }

        const totalPages = parseInt(data.archive.total_pages, 10);

        // Om det finns fler än en sida, skapa intervall
        if (totalPages > 1) {
          const endPage = pages + totalPages - 1;
          pages = `${pages}-${endPage}`;
        }
      }
    }
  }

  return pages;
}

function getTitleText(
  data,
  numberOfSubrecordsMedia,
  numberOfTranscribedSubrecordsMedia,
) {
  let titleText;
  const transcriptionStatusElement = data.transcriptionstatus;

  if (['undertranscription', 'transcribed', 'reviewing', 'needsimprovement', 'approved'].includes(transcriptionStatusElement)) {
    titleText = 'Titel granskas';
  } else if (data.transcriptionstatus === 'readytotranscribe' && data.transcriptiontype === 'sida' && numberOfSubrecordsMedia > 0) {
    titleText = `Sida ${getPages(data)} (${numberOfTranscribedSubrecordsMedia} ${l(
      numberOfTranscribedSubrecordsMedia === 1 ? 'sida avskriven' : 'sidor avskrivna',
    )})`;
  } else if (data.transcriptionstatus === 'readytotranscribe') {
    titleText = 'Ej avskriven';
    if (data.title) {
      titleText = `${getTitle(data.title, data.contents)} (${titleText})`;
    }
  } else {
    titleText = getTitle(data.title, data.contents);
  }

  return titleText;
}

function getTextElement(
  data,
  numberOfSubrecordsMedia,
  numberOfTranscribedSubrecordsMedia,
  highlightedText,
  highlight,
  sitevisionUrl,
) {
  let textElement;

  const isReadyToTranscribe = data.transcriptionstatus === 'readytotranscribe';
  const hasMedia = data.media.length > 0;

  if (sitevisionUrl) {
    textElement = <SitevisionContent url={sitevisionUrl.value} />;
  } else if (isReadyToTranscribe && hasMedia) {
    textElement = (
      <div>
        <p>
          <strong>
            {
              data.transcriptiontype === 'sida' && numberOfSubrecordsMedia > 0
                ? `${numberOfTranscribedSubrecordsMedia} ${l('av')} ${numberOfSubrecordsMedia} ${l('sidor avskrivna')}`
                : l('Den här uppteckningen är inte avskriven.')
            }
          </strong>
          <br />
          <br />
          {l('Vill du vara med och tillgängliggöra samlingarna för fler? Hjälp oss att skriva av berättelser!')}
        </p>
        <TranscribeButton
          className="button button-primary"
          label={`${l('Skriv av')} ${data.transcriptiontype === 'sida' ? l('sida för sida') : ''}`}
          title={data.title}
          recordId={data.id}
          archiveId={data.archive.archive_id}
          places={data.places}
          images={data.media}
          transcriptionType={data.transcriptiontype}
          random={false}
        />
      </div>
    );
    if (data.transcriptiontype === 'sida' && data.media.every((page) => page.transcriptionstatus !== 'readytotranscribe')) {
      textElement = <p>{l('Den här uppteckningen är avskriven och granskas.')}</p>;
    }
  } else if (data.transcriptionstatus === 'undertranscription') {
    textElement = <p>{l('Den här uppteckningen håller på att transkriberas av annan användare.')}</p>;
  } else {
    const pdfElements = [];
    let pdfObjects;

    if (
      data.media?.filter((item) => item.type === 'pdf').length >= 1
      && data.media.filter((item) => item.type === 'image').length === 0
    ) {
      pdfObjects = data.media.filter((item) => item.type === 'pdf');
    }

    const text = (highlight && highlightedText) || data.text;

    if (pdfObjects?.length > 0) {
      pdfObjects.forEach((pdfObject) => {
        pdfElements.push(<PdfViewer height="100%" url={(config.pdfUrl || config.imageUrl) + pdfObject.source} key={pdfObject.source} />);
      });
    }

    textElement = (
      <div>
        <div className="record-text-container">
          {text
            ? text.split(/\/\s*$/m).map((textPart) => (
              <div key={textPart} className="record-text display-line-breaks" dangerouslySetInnerHTML={{ __html: textPart.replace(/^\s*|\s*$/g, '') }} />
            ))
            : ''}
        </div>
        {pdfElements.length ? pdfElements : ''}
      </div>
    );
  }

  return textElement;
}

const mediaImageClickHandler = (e) => {
  if (window.eventBus) {
    // Skickar overlay.viewimage till eventBus
    // ImageOverlay modulen lyssnar på det och visar bilden
    window.eventBus.dispatch('overlay.viewimage', {
      imageUrl: e.source,
      type: e.type,
    });
  }
};

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
    const navigate = useNavigate();
    navigate(`/records/${archiveIdRow}${createSearchRoute(localparams)}`);
  }
};

const getIndicator = (item) => {
  if (item.transcriptionstatus === 'transcribed') {
    return (
      <div className="thumbnail-indicator transcribed-indicator">
        <FontAwesomeIcon icon={faLock} />
      </div>
    );
  }

  if (item.transcriptionstatus === 'published') {
    return (
      <div className="thumbnail-indicator published-indicator">
        <FontAwesomeIcon icon={faNewspaper} />
      </div>
    );
  }

  return null;
};

function getImageItems(data, highlightedMediaTexts, highlight) {
  if (!data || !data.media?.length) {
    return []; // Om det inte finns media, returnera en tom array
  }

  const imageDataItems = data.media.filter((dataItem) => dataItem.type === 'image');

  return imageDataItems.map((mediaItem, index) => {
    if (!mediaItem.source.includes('.pdf')) {
      // För 'sida' och publicerade transkriptioner, visa rader med kolumner (bild och text)
      if (data.transcriptiontype === 'sida' && data.transcriptionstatus === 'published') {
        return (
          <div className="row record-text-and-image" key={mediaItem.source}>
            <div className="eight columns display-line-breaks">
              <div
                dangerouslySetInnerHTML={{
                  __html: (highlight && highlightedMediaTexts[`${index}`]) || mediaItem.text,
                }}
              />
              {mediaItem.comment && mediaItem.comment.trim() !== '' && (
                <div>
                  <br />
                  <strong>Kommentar:</strong>
                  <br />
                  {mediaItem.comment}
                </div>
              )}
            </div>
            <div className="four columns">
              <div
                data-type="image"
                data-image={mediaItem.source}
                onClick={() => mediaImageClickHandler(mediaItem)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    mediaImageClickHandler(mediaItem);
                  }
                }}
                className="archive-image"
                role="button"
                tabIndex={0} // Gör elementet fokuserbart
              >
                <img src={config.imageUrl + mediaItem.source} alt="" />
                {mediaItem.title && (
                  <div className="media-title sv-portlet-image-caption">
                    {mediaItem.title}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // För oberoende kolumner med bilder och indikatorer
      return (
        <div
          key={mediaItem.source}
          data-type="image"
          data-image={mediaItem.source}
          onClick={() => mediaImageClickHandler(mediaItem)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              mediaImageClickHandler(mediaItem);
            }
          }}
          className="archive-image"
          role="button"
          tabIndex={0}
          style={{ position: 'relative' }}
        >
          <img src={config.imageUrl + mediaItem.source} alt="" />
          {getIndicator(mediaItem)}
          {mediaItem.title && (
            <div className="media-title sv-portlet-image-caption">
              {mediaItem.title}
            </div>
          )}
        </div>
      );
    }
    return null; // Returnera null för att undvika undefined element
  });
}

function getAudioItems(data) {
  if (!data || !data.media?.length) {
    return []; // Om ingen media finns, returnera en tom array
  }

  const audioDataItems = data.media.filter((dataItem) => dataItem.type === 'audio');

  return audioDataItems.map((mediaItem) => (
    <tr key={mediaItem.source}>
      <td data-title="Lyssna:" width="50px">
        <ListPlayButton
          media={mediaItem}
          recordId={data.id}
          recordTitle={getAudioTitle(
            data.title,
            data.contents,
            data.archive.archive_org,
            data.archive.archive,
            mediaItem.source,
            data.year,
            data.persons,
          )}
        />
      </td>
      <td>
        {getAudioTitle(
          data.title,
          data.contents,
          data.archive.archive_org,
          data.archive.archive,
          mediaItem.source,
          data.year,
          data.persons,
        )}
      </td>
    </tr>
  ));
}

function getContentsElement(
  data,
  titleText,
  expandedContents,
  toggleContentsExpand,

) {
  if (!data || !data.contents) {
    return null; // Returnera null om det inte finns något innehåll
  }

  // Om innehållet redan finns i titeln, visa inte contentsElement
  if (titleText && titleText.includes(data.contents)) {
    return null;
  }

  return (
    <div>
      <button
        className="headwords-toggle"
        type="button"
        tabIndex={0}
        style={{
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
        onClick={toggleContentsExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleContentsExpand();
          }
        }}
      >
        <FontAwesomeIcon icon={expandedContents ? faChevronDown : faChevronRight} />
        &nbsp;
        Innehållsuppgifter i register
      </button>
      <div className={`record-text realkatalog-content display-line-breaks ${expandedContents ? 'show' : 'hide'}`}>
        <p />
        <div
          dangerouslySetInnerHTML={{
            __html: data.contents,
          }}
        />
      </div>
    </div>
  );
}

function getHeadwordsElement(data, expandedHeadwords, toggleHeadwordsExpand) {
  let cleanHTMLheadwords = '';
  if (data && data.headwords) {
    const formattedHeadwords = data.headwords.trim().replace(/( Sida| Sidor)/g, '\n$1');
    // Om arkivet är 'Uppsala' och det finns headwords, då formaterar vi huvudorden
    if (data.archive.archive_org === 'Uppsala') {
      const anchorStart = '<a href="https://www5.sprakochfolkminnen.se/Realkatalogen/';
      const anchorEnd = '" target="_blank">Visa indexkort</a>';
      cleanHTMLheadwords = sanitizeHtml(
        formattedHeadwords.replaceAll('[[', anchorStart).replaceAll(']]', anchorEnd),
        {
          allowedTags: ['b', 'i', 'em', 'strong', 'a'],
          allowedAttributes: {
            a: ['href', 'target'],
          },
        },
      );
    } else {
      // Behåll de formaterade huvudorden oförändrade om arkivet inte är 'Uppsala'
      cleanHTMLheadwords = formattedHeadwords;
    }
  }
  return (
    <div>
      <button
        className="headwords-toggle"
        type="button"
        tabIndex={0}
        style={{
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
        onClick={toggleHeadwordsExpand}
        onKeyDown={(e) => {
          // Aktivera toggling vid "Enter" eller "Space"
          if (e.key === 'Enter' || e.key === ' ') {
            toggleHeadwordsExpand();
          }
        }}
      >
        <FontAwesomeIcon icon={expandedHeadwords ? faChevronDown : faChevronRight} />
        &nbsp;
        Uppgifter från äldre innehållsregister
      </button>
      <div className={`record-text realkatalog-content display-line-breaks ${expandedHeadwords ? 'show' : 'hide'}`}>
        <b>
          Information till läsaren: denna arkivhandling kan innehålla
          fördomar och språkbruk från en annan tid.
        </b>
        <br />
        Delar av Isofs äldre arkivmaterial kan vara svårt att närma sig och använda
        då det återspeglar fördomsfulla synsätt och ett språkbruk som vi inte bör använda i dag.
        <br />
        <b>Läs mer</b>
        <br />
        <a href="https://www.isof.se/arkiv-och-insamling/arkivsamlingar/folkminnessamlingar/fordomar-och-aldre-sprakbruk-i-samlingarna">
          Fördomar och äldre språkbruk i samlingarna.
          &nbsp;
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
        </a>
        <p />
        <div
          // Rendera headwords med säkerhetssaniterad HTML
          dangerouslySetInnerHTML={{
            __html: cleanHTMLheadwords,
          }}
        />
      </div>
    </div>
  );
}

function getPdfItems(data) {
  if (!data || !data.media?.length) {
    return []; // Om ingen media finns, returnera en tom array
  }

  const pdfDataItems = data.media.filter((dataItem) => dataItem.type === 'pdf');

  return pdfDataItems.map((mediaItem) => (
    <a
      data-type="pdf"
      href={config.pdfUrl + mediaItem.source}
      key={`pdf-${mediaItem.source}`}
      className="archive-image pdf"
      download
    >
      <div className="pdf-icon" />
      {mediaItem.title && (
        <div className="media-title sv-portlet-image-caption">
          {mediaItem.title}
        </div>
      )}
    </a>
  ));
}

function getMetadataItems(data) {
  if (!data.metadata?.length || !config.siteOptions.recordView?.visible_metadata_fields?.length) {
    return []; // Om det inte finns metadata eller synliga fält, returnera en tom array
  }

  const metadataItems = [];
  let itemCount = 0;

  const getMetadataTitle = (item) => (
    config.siteOptions.metadataLabels?.[item] ?? item
  );

  data.metadata.forEach((item) => {
    if (config.siteOptions.recordView.visible_metadata_fields.includes(item.type)) {
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
        metadataItems.push(<div className="grid-divider-3 u-cf" key={`cf-${item.value}-3`} />);
      }

      if (itemCount % 2 === 0) {
        metadataItems.push(<div className="grid-divider-2 u-cf" key={`cf-${item.value}-2`} />);
      }
    }
  });

  return metadataItems;
}

function getPersonItems(data, routeParams) {
  if (!data.persons?.length) {
    return []; // Returnera en tom array om inga personer finns
  }

  return data.persons.map((person) => (
    <tr key={person.id}>
      <td data-title="">
        {!config.siteOptions.disablePersonLinks && config.siteOptions.disableInformantLinks && ['i', 'informant'].includes(person.relation) && person.name}
        {!config.siteOptions.disablePersonLinks && !(config.siteOptions.disableInformantLinks && ['i', 'informant'].includes(person.relation)) && (
          <a href={`#/persons/${person.id}${routeParams || ''}`}>
            {person.name ? person.name : ''}
          </a>
        )}
        {config.siteOptions.disablePersonLinks && person.name}
      </td>
      <td data-title="Födelseår">
        {person.birth_year && person.birth_year > 0 ? person.birth_year : ''}
      </td>
      <td data-title="Födelseort">
        {person.home && person.home.length > 0 && (
          <a href={`#/places/${person.home[0].id}${routeParams || ''}`}>
            {`${person.home[0].name}, ${person.home[0].harad}`}
          </a>
        )}
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
  ));
}

function getPlaceItems(data, routeParams) {
  if (!data.places || data.places.length === 0) {
    return []; // Returnera en tom array om inga platser finns
  }

  return data.places.map((place) => (
    <tr key={place.id}>
      <td>
        {place.specification ? `${place.specification} i ` : ''}
        <a href={`#/places/${place.id}${routeParams || ''}`}>
          {`${place.name}, ${place.fylke ? place.fylke : place.harad}`}
        </a>
      </td>
    </tr>
  ));
}

/*
function getTaxonomyElement(data, routeParams) {
  if (!data.taxonomy) {
    return null; // Om det inte finns någon taxonomi, returnera null
  }

  if (data.taxonomy.name) {
    return (
      <p>
        <strong>{l('Kategori')}</strong>
        <br />
        <a href={`#/places/category/${data.taxonomy.category.toLowerCase()}${routeParams || ''}`}>
          {l(data.taxonomy.name)}
        </a>
      </p>
    );
  }

  if (Array.isArray(data.taxonomy) && data.taxonomy.length > 0) {
    const taxonomyLinks = data.taxonomy
      .filter((taxonomyItem) => taxonomyItem.category)
      .map(
      (taxonomyItem) => `<a href="#/places/category/${
        taxonomyItem.category.toLowerCase()}${routeParams || ''
      }">
        ${l(taxonomyItem.name)}
      </a>`
      ).join(', ');

    return (
      <p>
        <strong>{l('Kategori')}</strong>
        <br />
        <span dangerouslySetInnerHTML={{ __html: taxonomyLinks }} />
      </p>
    );
  }

  return null;
}
  */

export default function RecordView({ mode = 'material' }) {
  const { results: resultsPromise } = useLoaderData(); // Loader data hanteras som en Promise
  const [subrecords, setSubrecords] = useState([]);
  const [highlight, setHighlight] = useState(true);
  const [numberOfSubrecordsMedia, setNumberOfSubrecordsMedia] = useState(0);
  const [numberOfTranscribedSubrecordsMedia, setNumberOfTranscribedSubrecordsMedia] = useState(0);

  const [expandedContents, setExpandedContents] = useState(false);
  const toggleContentsExpand = () => {
    setExpandedContents(!expandedContents);
  };

  const [expandedHeadwords, setExpandedHeadwords] = useState(false);
  const toggleHeadwordsExpand = () => {
    setExpandedHeadwords(!expandedHeadwords);
  };
  const location = useLocation();
  const params = useParams();
  const routeParams = createSearchRoute(
    createParamsFromRecordRoute(location.pathname),
  );

  const collections = useMemo(() => new RecordsCollection((json) => {
    setSubrecords(json.data);
  }), []);

  return (
    <div className="container">

      <Suspense fallback={(
        <>
          <div className="container-header" style={{ height: 130 }} />
          {/* <div>Laddanimation</div> */}
        </>
      )}
      >
        <Await resolve={resultsPromise}>
          {(loaderData) => {
            // Ladda upp och bearbeta datan från loader när den är tillgänglig
            const data = loaderData[0]?.data?.[0]?._source
              || loaderData[1]?._source
              || loaderData[0]?._source;

            // Flytta useEffect inuti Await-blocket
            useEffect(() => {
              if (data?.archive) {
                const fetchSubrecords = () => {
                  const fetchParams = {
                    search: data.archive.archive_id_row,
                    recordtype: 'one_record',
                  };
                  collections.fetch(fetchParams);
                };

                fetchSubrecords();

                const { eventBus } = window;
                if (eventBus) {
                  eventBus.addEventListener('overlay.transcribe.sent', () => {
                    setTimeout(() => {
                      fetchSubrecords();
                    }, 3000);
                    setTimeout(() => {
                      fetchSubrecords();
                    }, 10000);
                  });
                }

                if (data.recordtype === 'one_record' && data.transcriptiontype === 'sida') {
                  const oneRecordPagesParams = {
                    search: data.id,
                  };
                  fetchRecordMediaCount(
                    oneRecordPagesParams,
                    setNumberOfSubrecordsMedia,
                    setNumberOfTranscribedSubrecordsMedia,
                  );
                }
              }

              // Återställ sidans titel när komponenten avmonteras
              return () => {
                document.title = config.siteTitle;
              };
            }, [data, collections]);

            // Resten av din renderingslogik, använd 'data' direkt
            // Exempelvis:
            const titleText = getTitleText(
              data,
              numberOfSubrecordsMedia,
              numberOfTranscribedSubrecordsMedia,
            );
            const highlightedText = loaderData[0].highlight?.text?.[0];
            const innerHits = loaderData.inner_hits?.media?.hits?.hits || [];
            const highlightedMediaTexts = useMemo(() => innerHits.reduce((acc, hit) => {
              const innerHitHighlightedText = hit?.highlight?.['media.text']?.[0];

              if (innerHitHighlightedText) {
                // eslint-disable-next-line no-underscore-dangle
                acc[`${hit?._nested?.offset}`] = innerHitHighlightedText;
              }

              return acc;
            }, {}), [innerHits]);

            const sitevisionUrl = data.metadata?.find((item) => item.type === 'sitevision_url');
            const textElement = getTextElement(
              data,
              undefined,
              undefined,
              highlightedText,
              true,
              sitevisionUrl,
            );
            const imageItems = getImageItems(data, highlightedMediaTexts, true);
            const audioItems = getAudioItems(data);
            const contentsElement = getContentsElement(
              data,
              titleText,
              expandedContents,
              toggleContentsExpand,
            );
            const headwordsElement = getHeadwordsElement(
              data,
              expandedHeadwords,
              toggleHeadwordsExpand,
            );
            const metadataItems = getMetadataItems(data);
            const pdfItems = getPdfItems(data);
            const personItems = getPersonItems(data, routeParams);
            const placeItems = getPlaceItems(data, routeParams);
            /* const taxonomyElement = getTaxonomyElement(data, routeParams); */
            const country = data.archive?.country || 'unknown';

            if (!data) {
              return <div>Posten finns inte.</div>;
            }

            return (
              <div>
                <div className="container-header">
                  <div className="row">
                    <div className="twelve columns">
                      <h2>
                        {titleText && titleText !== '[]' ? titleText : l('(Utan titel)')}
                        {' '}
                      </h2>
                      <p>
                        {
                          data.recordtype === 'one_accession_row' && l('Accession')
                        }
                        {
                          data.recordtype === 'one_record' && l('Uppteckning')
                        }
                        <span
                          className="switcher-help-button"
                          onClick={openSwitcherHelptext}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              openSwitcherHelptext();
                            }
                          }}
                          title="Om accessioner och uppteckningar"
                          role="button"
                          tabIndex={0}
                        >
                          ?
                        </span>

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
                          !!data.archive && !!data.archive.archive && !!getPages(data)
                          && (
                            <span style={{ marginLeft: 10 }}>
                              <strong>{l('Sidnummer')}</strong>
                              {`: ${getPages(data)}`}
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

                <div className="row">
                  <div className="ten columns disclaimer">
                    <small>
                      <i>
                        <b>Information till läsaren:</b>
                        {' '}
                        Denna arkivhandling kan innehålla fördomar och språkbruk från en annan tid.
                        <br />
                        Delar av Isofs äldre arkivmaterial kan vara svårt att närma sig och använda
                        då det återspeglar fördomsfulla synsätt och ett språkbruk som vi inte bör
                        använda i dag.
                        <br />
                        <a href="https://www.isof.se/arkiv-och-insamling/arkivsamlingar/folkminnessamlingar/fordomar-och-aldre-sprakbruk-i-samlingarna" target="_blank" rel="noreferrer">
                          Läs mer om Fördomar och äldre språkbruk i samlingarna.
                          &nbsp;
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                        </a>
                      </i>
                    </small>
                  </div>
                </div>
                <div className="row">
                  {
                    (data.text || textElement || data.headwords || headwordsElement)
                    && (
                      <div className={`${sitevisionUrl || imageItems.length === 0 || ((config.siteOptions.recordView && config.siteOptions.recordView.audioPlayerPosition === 'under') && (config.siteOptions.recordView && config.siteOptions.recordView.imagePosition === 'under') && (config.siteOptions.recordView && config.siteOptions.recordView.pdfIconsPosition === 'under')) ? 'twelve' : 'eight'} columns`}>
                        {/* audio items above text items that includes pdf */}
                        {
                          audioItems.length > 0 && (sitevisionUrl || (config.siteOptions.recordView && config.siteOptions.recordView.audioPlayerPosition === 'under'))
                          && (
                            <div className="table-wrapper">
                              <table width="100%">
                                <tbody>
                                  {audioItems}
                                </tbody>
                              </table>
                            </div>
                          )
                        }

                        {
                          <>
                            {data.contents && contentsElement}
                            {textElement}
                            {/* add a switch that toggles the state variable highlight */}
                            {(highlightedText || innerHits.length > 0)
                              && (
                                <label htmlFor="highlight">
                                  <input
                                    type="checkbox"
                                    id="highlight"
                                    checked={highlight}
                                    onChange={() => setHighlight(!highlight)}
                                  />
                                  <span style={{ marginLeft: 10 }}>Markera sökord</span>
                                </label>
                              )}
                            {data.headwords && headwordsElement}
                          </>
                        }

                        {
                          imageItems.length > 0 && (sitevisionUrl || (config.siteOptions.recordView && config.siteOptions.recordView.imagePosition === 'under'))
                          && (
                            <div>
                              {imageItems}
                            </div>
                          )
                        }

                        {
                          pdfItems.length > 0 && (sitevisionUrl || (config.siteOptions.recordView && config.siteOptions.recordView.pdfIconsPosition === 'under'))
                          && (
                            <div>
                              {pdfItems}
                            </div>
                          )
                        }

                      </div>
                    )
                  }

                  {
                    !sitevisionUrl && (!config.siteOptions.recordView || !config.siteOptions.recordView.imagePosition || config.siteOptions.recordView.imagePosition === 'right' || !config.siteOptions.recordView.pdfIconsPosition || config.siteOptions.recordView.pdfIconsPosition === 'right' || !config.siteOptions.recordView.audioPlayerPosition || config.siteOptions.recordView.audioPlayerPosition === 'right') && (imageItems.length > 0 || audioItems.length > 0 || pdfItems.length > 0)
                    && (
                      <div className={`columns ${audioItems.length > 0 ? 'twelve' : 'four'} u-pull-left`}>

                        {
                          (!config.siteOptions.recordView || !config.siteOptions.recordView.audioPlayerPosition || config.siteOptions.recordView.audioPlayerPosition === 'right') && audioItems.length > 0
                          && (
                            <div className="table-wrapper">
                              <table width="100%">
                                <tbody>
                                  {audioItems}
                                </tbody>
                              </table>
                            </div>
                          )
                        }

                        {
                          // transcriptiontype != 'sida'
                          // If not transcribed page by page: Text and images in independent columns
                          data.transcriptiontype && data.transcriptiontype !== 'sida'
                          && (
                            (!config.siteOptions.recordView || !config.siteOptions.recordView.imagePosition || config.siteOptions.recordView.imagePosition === 'right') && imageItems.length > 0
                            && imageItems
                          )
                        }

                        {
                          (!config.siteOptions.recordView || !config.siteOptions.recordView.pdfIconsPosition || config.siteOptions.recordView.pdfIconsPosition === 'right') && pdfItems.length > 0
                          && pdfItems
                        }

                      </div>
                    )
                  }

                </div>
                {
                  metadataItems.length > 0
                  && (
                    <div className="grid-items">

                      {metadataItems}

                      <div className="u-cf" />

                    </div>
                  )
                }

                {
                  // transcriptiontype = 'sida' and transcriptionstatus = 'published'
                  // If transcribed page by page: Text and images in dependent columns
                  // each row with dependent text and image
                  data.transcriptiontype && data.transcriptiontype === 'sida' && data.transcriptionstatus && data.transcriptionstatus === 'published'
                  && (
                    imageItems.length > 0 && (sitevisionUrl || (config.siteOptions.recordView && config.siteOptions.recordView.imagePosition === 'under'))
                    && (
                      { imageItems }
                    )
                  )
                }

                {
                  data.transcriptiontype === 'sida' && (!config.siteOptions.recordView || !config.siteOptions.recordView.imagePosition || config.siteOptions.recordView.imagePosition === 'right') && imageItems.length > 0
                  && <div className="record-view-thumbnails">{imageItems}</div>
                }

                {
                  data.comment && data.comment !== ''
                  && (
                    <div className="text-small">
                      <strong>{`${l('Kommentarer')}:`}</strong>
                      <p className="display-line-breaks" dangerouslySetInnerHTML={{ __html: data.comment.split(';').join('<br/>') }} />
                    </div>
                  )
                }

                {
                  data.transcribedby && data.transcribedby !== ''
                  && (
                    <p className="text-small">
                      <strong>{`${l('Transkriberad av')}: `}</strong>
                      <span dangerouslySetInnerHTML={{ __html: data.transcribedby }} />
                    </p>
                  )
                }

                {
                  data.source && data.materialtype === 'tryckt'
                  && (
                    <p className="text-small">
                      <strong>{`${l('Tryckt källa')}: `}</strong>
                      <em>{data.source}</em>
                    </p>
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
                        `${makeArchiveIdHumanReadable(data.archive.archive_id, data.archive.archive_org)}, ${getPages(data) ? `s. ${getPages(data)}, ` : ''}${getArchiveName(data.archive.archive_org)}`
                      )}
                      title={l('Källhänvisning')}
                    />
                  </div>
                </div>
                <div className="row">
                  {
                    config.siteOptions?.copyrightContent && data.copyrightlicense
                    && (
                      <div className="six columns offset-by-six">
                        <div className="license" dangerouslySetInnerHTML={{ __html: config.siteOptions.copyrightContent[data.copyrightlicense] }} />
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
                          {getPages(data)}
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

                    {/* {
                      deactivate categories
                      taxonomyElement
                    } */}
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
          }}
        </Await>
      </Suspense>
    </div>
  );
}

RecordView.propTypes = {
  mode: PropTypes.string,
};
