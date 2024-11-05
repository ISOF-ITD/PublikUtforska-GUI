/* eslint-disable react/require-default-props */
import {
  Suspense, useEffect, // useState,
} from 'react';
import {
  Await, useLoaderData, useLocation, // useNavigate, //useParams,
} from 'react-router-dom';
import PropTypes from 'prop-types';
import CommentsElement from './CommentsElement';
import Disclaimer from '../Disclaimer';
import HeadwordsElement from './HeadwordsElement';
import loaderSpinner from '../../../../img/loader.gif';
// import MetadataItems from './MetadataItems';
import RecordViewFooter from './RecordViewFooter.js';
import PdfElement from './PdfElement';
import PersonItems from './PersonItems';
import PlaceItems from './PlaceItems';
import RecordViewHeader from './RecordViewHeader';
import RecordViewThumbnails from './RecordViewThumbnails';
import TextElement from './TextElement';
import SubrecordsElement from './SubrecordsElement';
import ReferenceLinks from './ReferenceLinks';
import TranscriptionPrompt from './TranscriptionPrompt';
import License from './License';
import { createSearchRoute, createParamsFromRecordRoute } from '../../../utils/routeHelper';
// import {
//   getTitleText,
//   getPages,
// } from '../../../utils/helpers';

function RecordView({ mode = 'material' }) {
  const { results: resultsPromise } = useLoaderData();
  // const [expandedHeadwords, setExpandedHeadwords] = useState(false);
  const location = useLocation();
  // const params = useParams();
  const routeParams = createSearchRoute(createParamsFromRecordRoute(location.pathname));
  // const navigate = useNavigate();

  // const archiveIdClick = (e) => {
  //   e.preventDefault();
  //   const archiveIdRow = e.target.dataset.archiveidrow;
  //   const { recordtype } = e.target.dataset;
  //   const { search } = e.target.dataset;
  //   const localparams = {
  //     search,
  //     recordtype,
  //   };
  //   if (archiveIdRow) {
  //     navigate(`/records/${archiveIdRow}${createSearchRoute(localparams)}`);
  //   }
  // };

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
    document.title = 'Arkiv Uppteckning'; // Justera efter datan om så behövs
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

            return (
              <>
                <small>RecordViewHeader</small>
                <RecordViewHeader
                  data={data}
                  subrecordsCount={subrecordsCount}
                  location={location}
                />
                <div className="container-body">
                  <Disclaimer />
                  <RecordViewThumbnails
                    data={data}
                    mediaImageClickHandler={mediaImageClickHandler}
                  />
                  <TranscriptionPrompt data={data} />
                  <PdfElement data={data} />
                  <TextElement
                    data={data}
                    highlightData={highlightData}
                    mediaImageClickHandler={mediaImageClickHandler}
                  />
                  <HeadwordsElement data={data} />
                  <CommentsElement data={data} />
                  <SubrecordsElement data={data} subrecordsCount={subrecordsCount} mode={mode} />
                  <PersonItems data={data} routeParams={routeParams} />
                  <PlaceItems data={data} routeParams={routeParams} />
                  <ReferenceLinks data={data} />
                  <License data={data} />
                  <RecordViewFooter data={data} />
                  {/* <MetadataItems data={data} /> */}
                </div>
              </>
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
