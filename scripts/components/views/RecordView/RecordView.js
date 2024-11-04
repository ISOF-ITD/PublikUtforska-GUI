import {
  Suspense, useState, useEffect,
} from 'react';
import {
  Await, useLoaderData, useLocation, useNavigate, useParams,
} from 'react-router-dom';
import CommentsElement from './CommentsElement';
import Disclaimer from '../Disclaimer';
import HeadwordsElement from './HeadwordsElement';
import loaderSpinner from '../../../../img/loader.gif';
import MetadataItems from './MetadataItems';
import PdfElement from './PdfElement';
import PersonItems from './PersonItems';
import PlaceItems from './PlaceItems';
import RecordViewHeader from './RecordViewHeader';
import RecordViewThumbnails from './RecordViewThumbnails';
import TextElement from './TextElement';
import TranscriptionPrompt from './TranscriptionPrompt';
import { createSearchRoute, createParamsFromRecordRoute } from '../../../utils/routeHelper';
import {
  getTitleText,
  getPages,
} from '../../../utils/helpers';

function RecordView({ mode = 'material' }) {
  const { results: resultsPromise } = useLoaderData();
  const [expandedContents, setExpandedContents] = useState(false);
  const [expandedHeadwords, setExpandedHeadwords] = useState(false);
  const location = useLocation();
  const params = useParams();
  const routeParams = createSearchRoute(createParamsFromRecordRoute(location.pathname));
  const navigate = useNavigate();

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
            { data: subrecords },
          ]) => {
            // i records[0] finns highlights!
            if (!data) return <div>Posten finns inte.</div>;
            const titleText = getTitleText(data);
            const country = data.archive?.country || 'unknown';
            const mediaItems = data.media || [];
            const pages = getPages(data);

            // if (data?.archive?.archive_id_row) {
            //   fetchSubrecords(data.archive.archive_id_row); // Anropa fetchSubrecords när archive_id_row finns
            // }

            return (
              <>
              <small>RecordViewHeader</small>
                <RecordViewHeader
                  data={data}
                  subrecords={subrecords}
                  location={location}
                />
                <div className="container-body">
                  <Disclaimer />
                  { /* alla one_record: översiktsvy som man kan fälla ut, finns alltid med */ }
                  {/* bläddra funktion? */}
                  <RecordViewThumbnails {...{ data, mediaImageClickHandler }} />
                  <TranscriptionPrompt data={data} />
                  <PdfElement data={data} />
                  <TextElement {...{ data, highlightData, mediaImageClickHandler }} />
                  <HeadwordsElement data={data} expanded={expandedHeadwords} toggle={() => setExpandedHeadwords(!expandedHeadwords)} />
                  <CommentsElement data={data} />
                  <MetadataItems data={data} />
                  <hr />
                  <PersonItems data={data} routeParams={routeParams} />
                  <hr />
                  <PlaceItems data={data} routeParams={routeParams} />
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
