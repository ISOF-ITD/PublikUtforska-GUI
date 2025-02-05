import React, { lazy, Suspense, useEffect } from 'react';
import {
  Await,
  useLoaderData,
  useLocation,
} from 'react-router-dom';
import PropTypes from 'prop-types';
import { createSearchRoute, createParamsFromRecordRoute } from '../../../utils/routeHelper';
import loaderSpinner from '../../../../img/loader.gif';
import { getTitleText } from '../../../utils/helpers';
import config from '../../../config';

// Lazy loada komponenter som kanske inte behövs direkt
const RecordViewHeader = lazy(() => import('./RecordViewHeader'));
const RecordViewThumbnails = lazy(() => import('./RecordViewThumbnails'));
const ContentsElement = lazy(() => import('./ContentsElement'));
const HeadwordsElement = lazy(() => import('./HeadwordsElement'));
const AudioItemsElement = lazy(() => import('./AudioItemsElement'));
const PdfElement = lazy(() => import('./PdfElement'));
const TextElement = lazy(() => import('./TextElement'));
const CommentsElement = lazy(() => import('./CommentsElement'));
const License = lazy(() => import('./License'));
const SubrecordsElement = lazy(() => import('./SubrecordsElement'));
const PersonItems = lazy(() => import('./PersonItems'));
const PlaceItems = lazy(() => import('./PlaceItems'));
const RecordViewFooter = lazy(() => import('./RecordViewFooter'));
const ReferenceLinks = lazy(() => import('./ReferenceLinks'));
const Disclaimer = lazy(() => import('../Disclaimer'));
const RequestToTranscribePrompt = lazy(() => import('./RequestToTranscribePrompt'));
const TranscriptionPrompt = lazy(() => import('./TranscriptionPrompt'));
const SimilarRecords = lazy(() => import('./SimilarRecords'));

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
    document.title = config.siteTitle;
  }, []);

  return (
    <div className="container">
      <Suspense fallback={
        <>
          <div className="container-header" style={{ height: 130 }} />
          <div className="container-body">
            <img src={loaderSpinner} alt="Hämtar data" />
          </div>
        </>
      }>
        <Await
          resolve={resultsPromise}
          errorElement={<div>Det uppstod ett fel vid laddning av posten.</div>}
        >
          {([highlightData, { _source: data }, { data: subrecordsCount }]) => {
            if (!data) return <div>Posten finns inte.</div>;
            document.title = `${getTitleText(data, 0, 0)} - ${config.siteTitle}`;
            return (
              <article>
                <Suspense fallback={<div>Laddar...</div>}>
                  <RecordViewHeader data={data} subrecordsCount={subrecordsCount} location={location} />
                </Suspense>
                <div className="container-body">
                  <Suspense fallback={<div>Laddar information...</div>}>
                    <Disclaimer />
                    <TranscriptionPrompt data={data} />
                    <RequestToTranscribePrompt data={data} />
                    <RecordViewThumbnails data={data} mediaImageClickHandler={mediaImageClickHandler} />
                    <ContentsElement data={data} />
                    <HeadwordsElement data={data} />
                    <AudioItemsElement data={data} />
                    <PdfElement data={data} />
                    <TextElement data={data} highlightData={highlightData} mediaImageClickHandler={mediaImageClickHandler} />
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
                  </Suspense>
                </div>
              </article>
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

export default RecordView;
