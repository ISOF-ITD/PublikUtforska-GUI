/* eslint-disable react/require-default-props */
import {
  Suspense, useEffect, // useState,
} from 'react';
import {
  Await, useLoaderData, useLocation, // useNavigate, //useParams,
} from 'react-router-dom';
import PropTypes from 'prop-types';
import { createSearchRoute, createParamsFromRecordRoute } from '../../../utils/routeHelper';
import AudioItemsElement from './AudioItemsElement';
import CommentsElement from './CommentsElement';
import ContentsElement from './ContentsElement';
import Disclaimer from '../Disclaimer';
import HeadwordsElement from './HeadwordsElement';
import License from './License';
import loaderSpinner from '../../../../img/loader.gif';
import PdfElement from './PdfElement';
import PersonItems from './PersonItems';
import PlaceItems from './PlaceItems';
import RecordViewFooter from './RecordViewFooter';
import RecordViewHeader from './RecordViewHeader';
import RecordViewThumbnails from './RecordViewThumbnails';
import ReferenceLinks from './ReferenceLinks';
import SubrecordsElement from './SubrecordsElement';
import TextElement from './TextElement';
import RequestToTranscribePrompt from './RequestToTranscribePrompt';
import TranscriptionPrompt from './TranscriptionPrompt';
import SimilarRecords from './SimilarRecords';
import { getTitleText } from '../../../utils/helpers';
import config from '../../../config';

function RecordView({ mode = 'material' }) {
  const { results: resultsPromise } = useLoaderData();
  const location = useLocation();
  const routeParams = createSearchRoute(createParamsFromRecordRoute(location.pathname));

  const mediaImageClickHandler = (mediaItem, mediaList, currentIndex) => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.viewimage', {
        imageUrl: mediaItem.source,
        type: mediaItem.type,
        mediaList, // Skicka hela listan
        currentIndex, // Skicka index för aktuell bild
      });
    }
  };

  useEffect(() => {
    document.title = config.siteTitle; // Justera efter datan om så behövs
  }, []);

  return (
    <div className="container">
      <Suspense fallback={(
        <>
          <div className="container-header" style={{ height: 130 }} />
          <div className="container-body">
            <img src={loaderSpinner} alt="Hämtar data" />
          </div>
        </>
      )}
      >
        <Await
          resolve={resultsPromise}
          errorElement={
            <div>Det uppstod ett fel vid laddning av posten.</div>
          }
        >
          {([
            highlightData,
            { _source: data },
            { data: subrecordsCount },
          ]) => {
            // i records[0] finns highlights!
            if (!data) return <div>Posten finns inte.</div>;
            // const titleText = getTitleText(data);
            // const country = data.archive?.country || 'unknown';
            // const mediaItems = data.media || [];
            // const pages = getPages(data);
            document.title = `${getTitleText(data, 0, 0)} - ${config.siteTitle}`;
            return (
              <article>
                <RecordViewHeader
                  data={data}
                  subrecordsCount={subrecordsCount}
                  location={location}
                />
                <div className="container-body">
                  <Disclaimer />
                  <TranscriptionPrompt data={data} />
                  <RequestToTranscribePrompt data={data} />
                  <RecordViewThumbnails
                    data={data}
                    mediaImageClickHandler={mediaImageClickHandler}
                  />
                  <ContentsElement data={data} />
                  <HeadwordsElement data={data} />
                  <AudioItemsElement data={data} />
                  <PdfElement data={data} />
                  <TextElement
                    data={data}
                    highlightData={highlightData}
                    mediaImageClickHandler={mediaImageClickHandler}
                  />
                  <CommentsElement data={data} />
                  <div className="row">
                    <div className="eight columns">
                      <ReferenceLinks data={data} />
                    </div>
                    <div className="four columns">
                      <License data={data} />
                    </div>
                  </div>
                  <SubrecordsElement data={data} subrecordsCount={subrecordsCount} mode={mode} />
                  <PersonItems data={data} routeParams={routeParams} />
                  <PlaceItems data={data} routeParams={routeParams} />
                  <hr />
                  <SimilarRecords data={data} />
                  <hr />
                  <RecordViewFooter data={data} />

                  {/* <MetadataItems data={data} /> */}
                </div>
              </article>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}

export default RecordView;

RecordView.propTypes = {
  mode: PropTypes.string,
};
