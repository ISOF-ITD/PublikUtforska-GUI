import { Suspense, useEffect } from "react";
import { Await, useLoaderData, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  createSearchRoute,
  createParamsFromRecordRoute,
} from "../../utils/routeHelper";
import ContentsElement from "../../components/views/RecordView/ContentsElement";
import Disclaimer from "../../components/views/Disclaimer";
import HeadwordsElement from "../../components/views/RecordView/HeadwordsElement";
import License from "../../components/views/RecordView/License";
import loaderSpinner from "../../../img/loader.gif";
import PdfElement from "../../components/views/RecordView/PdfElement";
import PersonItems from "../../components/views/RecordView/PersonItems";
import PlaceItems from "../../components/views/RecordView/PlaceItems";
import RecordViewFooter from "../../components/views/RecordView/RecordViewFooter";
import RecordViewHeader from "../../components/views/RecordView/RecordViewHeader";
import RecordViewThumbnails from "../../components/views/RecordView/RecordViewThumbnails";
import ReferenceLinks from "../../components/views/RecordView/ReferenceLinks";
import SubrecordsElement from "../../components/views/RecordView/SubrecordsElement";
import TextElement from "../../components/views/RecordView/TextElement";
import RequestToTranscribePrompt from "../../components/views/RecordView/RequestToTranscribePrompt";
import TranscriptionPrompt from "../../components/views/RecordView/TranscriptionPrompt";
import SimilarRecords from "../../components/views/RecordView/SimilarRecords";
import { getTitleText } from "../../utils/helpers";
import config from "../../config";
import CorrectionEditor from "./CorrectionEditor";

function CorrectionView({ mode = "transcribe" }) {
  const { results: resultsPromise } = useLoaderData();
  const location = useLocation();
  const routeParams = createSearchRoute(
    createParamsFromRecordRoute(location.pathname)
  );

  const mediaImageClickHandler = (mediaItem, mediaList, currentIndex) => {
    if (window.eventBus) {
      window.eventBus.dispatch("overlay.viewimage", {
        imageUrl: mediaItem.source,
        type: mediaItem.type,
        mediaList,
        currentIndex,
      });
    }
  };

  useEffect(() => {
    document.title = config.siteTitle;
  }, []);

  return (
    <div className="container">
      <Suspense
        fallback={
          <>
            <div className="container-header" style={{ height: 130 }} />
            <div className="container-body">
              <img src={loaderSpinner} alt="Hämtar data" />
            </div>
          </>
        }
      >
        <Await
          resolve={resultsPromise}
          errorElement={<div>Det uppstod ett fel vid laddning av posten.</div>}
        >
          {([highlightData, { _source: data }, { data: subrecordsCount }]) => {
            if (!data) return <div>Posten finns inte.</div>;
            document.title = `${getTitleText(data, 0, 0)} - ${
              config.siteTitle
            }`;
            return (
              <article>
                <RecordViewHeader
                  data={data}
                  subrecordsCount={subrecordsCount}
                  location={location}
                />
                <div className="container-body">
                  <TranscribePage />
                </div>
              </article>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}

CorrectionView.propTypes = {
  mode: PropTypes.string,
};

export default CorrectionView;
