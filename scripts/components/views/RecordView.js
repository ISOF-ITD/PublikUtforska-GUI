import { useState, useEffect } from 'react';
import {
  useNavigate, useLocation, useParams, useLoaderData,
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
import config from '../../config';
// import localLibrary from '../../utils/localLibrary';

import ShareButtons from '../ShareButtons';
import SimpleMap from './SimpleMap';
import ListPlayButton from './ListPlayButton';

import ContributeInfoButton from './ContributeInfoButton';
import FeedbackButton from './FeedbackButton';

import TranscribeButton from './transcribe/TranscribeButton';
// import ElementNotificationMessage from '../ElementNotificationMessage';
import SitevisionContent from '../SitevisionContent';
import PdfViewer from '../PdfViewer';

import { createSearchRoute, createParamsFromRecordRoute } from '../../utils/routeHelper';
import {
  getTitle, makeArchiveIdHumanReadable, getAudioTitle, getArchiveName, fetchRecordMediaCount,
} from '../../utils/helpers';

import RecordsCollection from '../collections/RecordsCollection';

import archiveLogoIsof from '../../../img/archive-logo-isof.png';
import archiveLogoIkos from '../../../img/archive-logo-ikos.png';

import { l } from '../../lang/Lang';
import RecordList from './RecordList';

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

export default function RecordView({ mode = 'material', openSwitcherHelptext }) {
  const params = useParams();
  const navigate = useNavigate();

  // const [saved, setSaved] = useState(false);
  const [subrecords, setSubrecords] = useState([]);
  const [highlight, setHighlight] = useState(true);
  const [numberOfSubrecordsMedia, setNumberOfSubrecordsMedia] = useState(0);
  const [numberOfTranscribedSubrecordsMedia, setNumberOfTranscribedSubrecordsMedia] = useState(0);

  const [expandedHeadwords, setExpandedHeadwords] = useState(false);
  const toggleHeadwordsExpand = () => {
    setExpandedHeadwords(!expandedHeadwords);
  };
  const [expandedContents, setExpandedContents] = useState(false);
  const toggleContentsExpand = () => {
    setExpandedContents(!expandedContents);
  };

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
      // Update Recordview using event, as an easy fix as fetchRecord(recordId) is in app.js
      // Maybe not needed as hide of overlay should call transcribecancel so
      // transcriptionstatus should be back at "readytotranscribe"
      // BUT maybe needed to get other record data as title back? But is title transcribed in page-by-page?
      // KOMMENTAR (Rico): Följande rad triggrar en oönskad omladdning när man stänger
      // transcriptionPageByPageOverlay, därför tar jag bort det:
      // -----------------------
      // eventBus.addEventListener('overlay.hide', forceUpdateFunc);
      // -----------------------
      // eventBus.addEventListener('overlay.hide-update-data', updateTranscribeButtonAndPageCounts);
    }
    if (data?.recordtype === 'one_record') {
      const oneRecordPagesParams = {
        search: data.id,
      };
      // We get new values from server and do not use calculated values in Rest-API: numberofonerecord, numberoftranscribedonerecord
      if (data.transcriptiontype === 'sida') {
        fetchRecordMediaCount(oneRecordPagesParams, setNumberOfSubrecordsMedia, setNumberOfTranscribedSubrecordsMedia);
        // fetchRecordMediaCount(transcribedOneRecordPagesParams, setNumberOfTranscribedSubrecordsMedia);
      }
    }
    // on unmount, set the document title back to the site title
    return () => {
      document.title = config.siteTitle;
    };
  }, []);

  // componentDidUpdate(prevProps, prevState) {
  // if (data.archive
  // && data.archive.archive_id_row
  // && (!prevState.data.archive
  // || prevState.data.archive.archive_id_row !== data.archive.archive_id_row)) {
  // this.fetchSubrecords();
  // }
  // }
  useEffect(() => {
    if (data.archive && data.archive.archive_id_row) {
      fetchSubrecords();
    }
  }, [data.archive]);

  //   componentWillUnmount() {
  //     if (window.eventBus) {
  //       window.eventBus.dispatch('overlay.hide');
  //     }

  // Sparar posten till localLibrary
  // const toggleSaveRecord = () => {
  //   const libraryItem = {
  //     id: data.id,
  //     title: data.title,
  //     place: data.places?.length > 0 ? data.places[0].name : null,
  //   };

  //   if (!localLibrary.find(libraryItem)) {
  //     localLibrary.add(libraryItem);
  //     setSaved(true);

  //     if (window.eventBus) {
  //       window.eventBus.dispatch('popup-notification.notify', null, `<strong>${data.title}</strong> ${l('har sparats till dina sägner')}.`);
  //     }
  //   } else {
  //     localLibrary.remove(libraryItem);
  //     setSaved(false);
  //   }
  // };

  const mediaImageClickHandler = (e) => {
    if (window.eventBus) {
      // Skickar overlay.viewimage till eventBus
      // ImageOverlay modulen lyssnar på det och visar bilden
      window.eventBus.dispatch('overlay.viewimage', {
        imageUrl: e.currentTarget.dataset.image,
        type: e.currentTarget.dataset.type,
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

  let imageItems = [];
  let pdfItems = [];
  let audioItems = [];

  const routeParams = createSearchRoute(
    createParamsFromRecordRoute(location.pathname),
  );

  if (data) {
    // Förberedar visuella media objekt
    if (data.media?.length > 0) {
      const imageDataItems = data.media.filter((dataItem) => dataItem.type === 'image');
      imageItems = imageDataItems.map((mediaItem, index) => {
        if (mediaItem.source.indexOf('.pdf') === -1) {
          if (data.transcriptiontype && data.transcriptiontype == 'sida' && data.transcriptionstatus && data.transcriptionstatus == 'published') {
            // transcriptiontype = 'sida' and transcriptionstatus = 'published'
            // Make rows with "columns": image-text and image
            return (
              <div className="row record-text-and-image">
                <div className="eight columns display-line-breaks">
                  <div>
                    {mediaItem.text}
                  </div>
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
                  <div data-type="image" data-image={mediaItem.source} onClick={mediaImageClickHandler} key={`image-${index}`} className="archive-image">
                    <img src={config.imageUrl + mediaItem.source} alt="" />
                    {
                      mediaItem.title
                      && <div className="media-title sv-portlet-image-caption">{mediaItem.title}</div>
                    }
                  </div>
                </div>
              </div>
            );
          }
          // Independent columns: one with text and one with images
          return (
            <div
              data-type="image"
              data-image={mediaItem.source}
              onClick={() => mediaImageClickHandler(mediaItem)}
              key={`image-${index}`}
              className="archive-image"
              style={{ position: 'relative' }}
            >
              <img src={config.imageUrl + mediaItem.source} alt="" />
              {getIndicator(mediaItem)}
              {
                  mediaItem.title
                  && <div className="media-title sv-portlet-image-caption">{mediaItem.title}</div>
                }
            </div>
          );
        }
        return null; // Return null to avoid undefined elements in the array
      });

      const audioDataItems = data.media.filter((dataItem) => dataItem.type === 'audio');
      audioItems = audioDataItems.map((mediaItem) => (
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

      const pdfDataItems = data.media.filter((dataItem) => dataItem.type === 'pdf');
      pdfItems = pdfDataItems.map((mediaItem) => (
        <a data-type="pdf" href={config.pdfUrl + mediaItem.source} key={`pdf-${mediaItem.source}`} className="archive-image pdf" download>
          <div className="pdf-icon" />
          {
            mediaItem.title
            && <div className="media-title sv-portlet-image-caption">{mediaItem.title}</div>
          }
        </a>
      ));

      const { recordView } = config.siteOptions;
      if (recordView?.imagePosition === recordView?.pdfIconsPosition) {
        imageItems = imageItems.concat(pdfItems);
        pdfItems = [];
      }
    }

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

    let textElement;
    let headwordsElement;
    let contentsElement;

    let forceFullWidth = false;

    const sitevisionUrl = data.metadata?.find((item) => item.type === 'sitevision_url');

    // Om vi har en sitevision_url definierad, använd vi SitevisionContent modulen
    const hasSitevisionUrl = sitevisionUrl;
    const isReadyToTranscribe = data.transcriptionstatus === 'readytotranscribe';
    const hasMedia = data.media.length > 0;

    function getPages() {
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
              let endPage = pages + totalPages - 1;
              pages = `${pages}-${endPage}`;
            }
          }
        }
      }
    
      return pages;
    }
    

    // Prepare title
    let titleText;
    const transcriptionStatusElement = data.transcriptionstatus;
    if (['undertranscription', 'transcribed', 'reviewing', 'needsimprovement', 'approved'].includes(transcriptionStatusElement)) {
      titleText = 'Titel granskas';
    } else if (data.transcriptionstatus === 'readytotranscribe' && data.transcriptiontype === 'sida' && numberOfSubrecordsMedia > 0) {
      titleText = `Sida ${getPages()} (${numberOfTranscribedSubrecordsMedia} ${l(
        numberOfTranscribedSubrecordsMedia === 1 ? 'sida avskriven' : 'sidor avskrivna',
      )})`;
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

    if (hasSitevisionUrl) {
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
            label={
              `${l('Skriv av')} ${data.transcriptiontype === 'sida' ? l('sida för sida') : ''}`
            }
            // helptext={
            //   data.transcriptiontype === 'sida'
            //     ? `${numberOfTranscribedSubrecordsMedia} ${l('av')} ${numberOfSubrecordsMedia} ${l('sidor avskrivna')}`
            //     : ''
            // }
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
      // special case: all pages are transcribed:
      if (data.transcriptiontype === 'sida' && data.media.every((page) => page.transcriptionstatus !== 'readytotranscribe')) {
        textElement = <p>{l('Den här uppteckningen är avskriven och granskas.')}</p>;
      }
    } else if (data.transcriptionstatus === 'undertranscription') {
      textElement = <p>{l('Den här uppteckningen håller på att transkriberas av annan användare.')}</p>;
    } else {
      // Om posten innehåller minst en pdf fil
      // (ingen text, inte ljudfiler och inte bilder), då visar vi pdf-filerna filen direkt
      // Initialize variables
      const pdfElements = [];
      let pdfObjects;

      // Check if there is at least one PDF file and no images or audio files
      if (
        // use the filter method to find all items of a certain type
        data.media?.filter((item) => item.type === 'pdf').length >= 1 // At least one PDF file
        && data.media.filter((item) => item.type === 'image').length === 0 // No images
        && data.media.filter((item) => item.type === 'audio').length === 0 // No audio files
      ) {
        // Set the pdfObjects variable to all PDF files
        // Use the filter method to find all items of a certain type
        pdfObjects = data.media.filter((item) => item.type === 'pdf');
        // Set the forceFullWidth variable to true
        forceFullWidth = true;
      }
      const text = (highlight && highlightedText) || data.text;
      // If there is at least one PDF file, create a PdfViewer component for every PDF file
      if (pdfObjects?.length > 0) {
        pdfObjects.forEach((pdfObject) => {
          // pdfElements.push(<PdfViewer height="800" url={(config.pdfUrl || config.imageUrl) + pdfObject.source} key={pdfObject.source} />);
          pdfElements.push(<PdfViewer height="100%" url={(config.pdfUrl || config.imageUrl) + pdfObject.source} key={pdfObject.source} />);
        });
      }

      textElement = (
        <div>
          <div className="record-text-container">
            {
              // for each text part, that is created by splitting the
              // text on every "/" followed and preceded by a line break, create a div
              // with the class name "record-text display-line-breaks"
              // and the text part as innerHTML. also remove a possible line break
              // at the beginning or end of the text part
              text ? text.split(/\/\s*$/m).map((textPart) => (
                <div
                  key={textPart}
                  className="record-text display-line-breaks"
                  dangerouslySetInnerHTML={{ __html: textPart.replace(/^\s*|\s*$/g, '') }}
                />
              ))
                : ''
            }
          </div>
          {
            // If there is at least one PDF file, create a PdfViewer component for every PDF file
            pdfElements.length ? pdfElements : ''
          }
        </div>
      );

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

      // If content Is In Title do not show contents element
      if (data?.contents && !titleText?.includes(data.contents)) {
        contentsElement = (
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
                // Aktiverar när "Enter" eller "Space" trycks ned
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
                // Lösning med säkerhetsbrist! Fundera på bättre lösning!
                dangerouslySetInnerHTML={{
                  __html: data.contents,
                }}
              />
            </div>
          </div>
        );
      }
      headwordsElement = (
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
              // Aktiverar när "Enter" eller "Space" trycks ned
              if (e.key === 'Enter' || e.key === ' ') {
                toggleHeadwordsExpand();
              }
            }}
          >
            <FontAwesomeIcon icon={expandedHeadwords ? faChevronDown : faChevronRight} />
            &nbsp;
            Uppgifter från  äldre innehållsregister
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
            <b>
              Läs mer
            </b>
            <br />
            <a href="https://www.isof.se/arkiv-och-insamling/arkivsamlingar/folkminnessamlingar/fordomar-och-aldre-sprakbruk-i-samlingarna">
              Fördomar och äldre språkbruk i samlingarna.
              &nbsp;
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
            </a>
            <p />
            <div
              // Lösning med säkerhetsbrist! Fundera på bättre lösning!
              dangerouslySetInnerHTML={{
                __html: cleanHTMLheadwords,
              }}
            />
          </div>
        </div>
      );
    }

    // Förbereder kategori länk
    let taxonomyElement;

    // Deactivate categories for now
    // if (data.taxonomy) {
    //   if (data.taxonomy.name) {
    //     taxonomyElement = (
    //       <p>
    //         <strong>{l('Kategori')}</strong>
    //         <br />
    //         <a href={`#/places/category/${data.taxonomy.category.toLowerCase()}${routeParams || ''}`}>{l(data.taxonomy.name)}</a>
    //       </p>
    //     );
    //   } else if (data.taxonomy.length > 0) {
    //     taxonomyElement = (
    //       <p>
    //         <strong>{l('Kategori')}</strong>
    //         <br />
    //         <span dangerouslySetInnerHTML={{
    //           __html: data.taxonomy.filter(
    //             (taxonomyItem) => taxonomyItem.category,
    //           ).map(
    //             (taxonomyItem) => `<a href="#/places/category/${taxonomyItem.category.toLowerCase()}${routeParams || ''}">${l(taxonomyItem.name)}</a>`,
    //           ).join(', '),
    //         }}
    //         />
    //       </p>
    //     );
    //   }
    // }

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
                  !!data.archive && !!data.archive.archive && !!getPages()
                  && (
                    <span style={{ marginLeft: 10 }}>
                      <strong>{l('Sidnummer')}</strong>
                      {`: ${getPages()}`}
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
          <div className="ten columns content-warning">
            <small>
              <i>
                <b>Information till läsaren:</b>
                {' '}
                Denna arkivhandling kan innehålla fördomar och språkbruk från en annan tid.
                <br />
                Delar av Isofs äldre arkivmaterial kan vara svårt att närma sig och använda då det återspeglar fördomsfulla synsätt och ett språkbruk som vi inte bör använda i dag.
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
              <div className={`${sitevisionUrl || imageItems.length === 0 || forceFullWidth || ((config.siteOptions.recordView && config.siteOptions.recordView.audioPlayerPosition === 'under') && (config.siteOptions.recordView && config.siteOptions.recordView.imagePosition === 'under') && (config.siteOptions.recordView && config.siteOptions.recordView.pdfIconsPosition === 'under')) ? 'twelve' : 'eight'} columns`}>
                {
                  <>
                    {data.contents && contentsElement}
                    {textElement}
                    {/* add a switch that toggles the state variable highlight */}
                    {highlightedText
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
                  data.comment && data.comment !== ''
                  && (
                    <p className="text-small">
                      <strong>{`${l('Kommentarer')}:`}</strong>
                      <br />
                      <div className="display-line-breaks" dangerouslySetInnerHTML={{ __html: data.comment }} />
                    </p>
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

                {
                  audioItems.length > 0 && (sitevisionUrl || forceFullWidth || (config.siteOptions.recordView && config.siteOptions.recordView.audioPlayerPosition === 'under'))
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
                  imageItems.length > 0 && (sitevisionUrl || forceFullWidth || (config.siteOptions.recordView && config.siteOptions.recordView.imagePosition === 'under'))
                  && (
                    <div>
                      {imageItems}
                    </div>
                  )
                }

                {
                  pdfItems.length > 0 && (sitevisionUrl || forceFullWidth || (config.siteOptions.recordView && config.siteOptions.recordView.pdfIconsPosition === 'under'))
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
            !sitevisionUrl && !forceFullWidth && (!config.siteOptions.recordView || !config.siteOptions.recordView.imagePosition || config.siteOptions.recordView.imagePosition === 'right' || !config.siteOptions.recordView.pdfIconsPosition || config.siteOptions.recordView.pdfIconsPosition === 'right' || !config.siteOptions.recordView.audioPlayerPosition || config.siteOptions.recordView.audioPlayerPosition === 'right') && (imageItems.length > 0 || audioItems.length > 0 || pdfItems.length > 0)
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
          // If transcribed page by page: Text and images in dependent columns each row with dependent text and image
          data.transcriptiontype && data.transcriptiontype === 'sida' && data.transcriptionstatus && data.transcriptionstatus === 'published'
          && (
            imageItems.length > 0 && (sitevisionUrl || forceFullWidth || (config.siteOptions.recordView && config.siteOptions.recordView.imagePosition === 'under'))
            && (
              { imageItems }
            )
          )
        }

        {
           data.transcriptiontype === 'sida' && (!config.siteOptions.recordView || !config.siteOptions.recordView.imagePosition || config.siteOptions.recordView.imagePosition === 'right') && imageItems.length > 0
          && <div className="record-view-thumbnails">{imageItems}</div>
        }

        <div className="row">

          <div className="six columns">
            <ShareButtons path={`${config.siteUrl}#/records/${data.id}`} title={l('Kopiera länk')} />
          </div>

          <div className="six columns">
            {/* copies the citation to the clipboard */}
            <ShareButtons
              path={(
                `${makeArchiveIdHumanReadable(data.archive.archive_id, data.archive.archive_org)}, ${getPages() ? `s. ${getPages()}, ` : ''}${getArchiveName(data.archive.archive_org)}`
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
                  {getPages()}
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

RecordView.propTypes = {
  mode: PropTypes.string,
  openSwitcherHelptext: PropTypes.func.isRequired,
};
