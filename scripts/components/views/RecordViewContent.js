import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import sanitizeHtml from 'sanitize-html';
import PropTypes from 'prop-types';
import config from '../../config';
import { l } from '../../lang/Lang';
import PdfViewer from '../PdfViewer';
import TranscribeButton from './TranscribeButton';
import ListPlayButton from './ListPlayButton';
import { getAudioTitle } from '../../utils/helpers';

export default function RecordViewContent({ data, highlightedText }) {
  RecordViewContent.propTypes = {
    data: PropTypes.object.isRequired,
    highlightedText: PropTypes.string,
  };

  RecordViewContent.defaultProps = {
    highlightedText: '',
  };

  const [highlight, setHighlight] = useState(true);
  const [expandedHeadwords, setExpandedHeadwords] = useState(false);
  const toggleHeadwordsExpand = () => {
    setExpandedHeadwords(!expandedHeadwords);
  };

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

  let imageItems = [];
  let pdfItems = [];
  let audioItems = [];
  let textElement = null;
  let headwordsElement = null;
  const numberOfColumns = data.transcriptionstatus === 'readytotranscribe' ? 'eight' : 'twelve';

  if (data.transcriptionstatus === 'readytotranscribe' && data.media.length > 0) {
    // Gammal regel: Om "transkriberad" finns i texten lägger vi till
    // transkriberings knappen istället för att visa textan
    // else if (data.text && data.text.indexOf('transkriberad') > -1
    // && data.text.length < 25 && data.media.length > 0) {
    // Ny regel Om transcriptionstatus = readytotranscribe lägger vi till
    // transkriberings knappen istället för att visa texten
    textElement = (
      <div>
        <p>
          <strong>{l('Den här uppteckningen är inte avskriven.')}</strong>
          <br />
          <br />
          {l('Vill du vara med och tillgängliggöra samlingarna för fler? Hjälp oss att skriva av berättelser!')}
        </p>
        <TranscribeButton
          className="button button-primary"
          label={l('Skriv av')}
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
    }
    const text = (highlight && highlightedText) || data.text;
    // If there is at least one PDF file, create a PdfViewer component for every PDF file
    if (pdfObjects?.length > 0) {
      pdfObjects.forEach((pdfObject) => {
        pdfElements.push(<PdfViewer height="100%" url={(config.pdfUrl || config.imageUrl) + pdfObject.source} key={pdfObject.source} />);
      });
    }

    if (data.media?.length > 0) {
      const imageDataItems = data.media.filter((dataItem) => dataItem.type === 'image');
      imageItems = imageDataItems.map((mediaItem, index) => {
        if (mediaItem.source.indexOf('.pdf') === -1) {
          return (
            <div data-type="image" data-image={mediaItem.source} onClick={mediaImageClickHandler} key={`image-${index}`} className="archive-image">
              <img src={config.imageUrl + mediaItem.source} alt="" />
              {
                mediaItem.title
                && <div className="media-title sv-portlet-image-caption">{mediaItem.title}</div>
              }
            </div>
          );
        }
      });

      textElement = (
        <div>
          <div className="record-text-container">
            {
              // for each text part, that is created by splitting the
              // text on every "/" followed and preceded by a line break, create a div
              // with the class name "record-text display-line-breaks"
              // and the text part as innerHTML. also remove a possible line break
              // at the beginning or end of the text part
              text ? text.split(/\/\s*$/m).map((textPart, i) => (
                <>
                  <div
                    key={textPart}
                    className="record-text display-line-breaks"
                    dangerouslySetInnerHTML={{ __html: textPart.replace(/^\s*|\s*$/g, '') }}
                  />
                  {imageItems[i]}
                </>
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
            <i>
              Delar av Isofs äldre arkivmaterial kan vara svårt att närma
              sig och använda eftersom det återspeglar fördomar, stereotyper,
              rasism och sexism. Här finns också ett förlegat och nedsättande
              språkbruk som vi inte använder i dag.
              <br />
              <a href="https://www.isof.se/arkiv-och-insamling/arkivsamlingar/folkminnessamlingar/fordomar-och-aldre-sprakbruk-i-samlingarna">
                Läs mer om fördomar och äldre språkbruk i samlingarna.
                &nbsp;
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              </a>
              <p />
            </i>
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

    const audioDataItems = data.media.filter((dataItem) => dataItem.type === 'audio');
    audioItems = audioDataItems.map((mediaItem) => (
      <tr key={mediaItem.source}>
        <td
          data-title="Lyssna:"
          width="50px"
        >
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

  return (
    <div className="row">

      {
        (data.text || textElement || data.headwords || headwordsElement)
        && (
          <div className={`${numberOfColumns} columns`}>
            {
              <>
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
              audioItems.length > 0 && ((config.siteOptions.recordView && config.siteOptions.recordView.audioPlayerPosition === 'under'))
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
              pdfItems.length > 0 && ((config.siteOptions.recordView && config.siteOptions.recordView.pdfIconsPosition === 'under'))
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
        (!config.siteOptions.recordView || !config.siteOptions.recordView.imagePosition || config.siteOptions.recordView.imagePosition === 'right' || !config.siteOptions.recordView.pdfIconsPosition || config.siteOptions.recordView.pdfIconsPosition === 'right' || !config.siteOptions.recordView.audioPlayerPosition || config.siteOptions.recordView.audioPlayerPosition === 'right') && (imageItems.length > 0 || audioItems.length > 0 || pdfItems.length > 0)
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
              (!config.siteOptions.recordView || !config.siteOptions.recordView.pdfIconsPosition || config.siteOptions.recordView.pdfIconsPosition === 'right') && pdfItems.length > 0
              && pdfItems
            }

          </div>
        )
      }

    </div>
  );
}
