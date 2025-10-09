/* eslint-disable react/require-default-props */
import {
  Suspense,
  useCallback,
  useEffect, // useState,
  useMemo,
} from "react";
import {
  Await,
  useLoaderData,
  useLocation,
  Outlet,
  useMatches, // useNavigate, //useParams,
} from "react-router-dom";
import PropTypes from "prop-types";
import {
  createSearchRoute,
  createParamsFromRecordRoute,
} from "../../../utils/routeHelper";
import ContentsElement from "./ContentsElement";
import Disclaimer from "../Disclaimer";
import HeadwordsElement from "./HeadwordsElement";
import License from "./License";
import loaderSpinner from "../../../../img/loader.gif";
import PdfElement from "./PdfElement";
import PersonItems from "./PersonItems";
import PlaceItems from "./PlaceItems";
import RecordViewFooter from "./RecordViewFooter";
import RecordViewHeader from "./RecordViewHeader";
import RecordViewThumbnails from "./RecordViewThumbnails";
import ReferenceLinks from "./ReferenceLinks";
import SubrecordsElement from "./SubrecordsElement";
import TextElement from "./TextElement";
import RequestToTranscribePrompt from "./RequestToTranscribePrompt";
import TranscriptionPrompt from "./TranscriptionPrompt";
import SimilarRecords from "./SimilarRecords";
import { getTitleText } from "../../../utils/helpers";
import config from "../../../config";
import AudioItems from "../../../features/AudioDescription/AudioItems";

function RecordView({ mode = "material" }) {
  const { results: resultsPromise } = useLoaderData();
  const location = useLocation();
  const matches = useMatches();
  const routeParams = createSearchRoute(
    createParamsFromRecordRoute(location.pathname)
  );

  // Check if we're on the transcribe route
  const isTranscribeRoute = matches.some((match) =>
    match.pathname.includes("/transcribe")
  );

  const mediaImageClickHandler = useCallback((mediaItem, mediaList, currentIndex) => {
    if (typeof window !== "undefined" && window.eventBus) {
      window.eventBus.dispatch("overlay.viewimage", {
        imageUrl: mediaItem.source,
        type: mediaItem.type,
        mediaList, // Skicka hela listan
        currentIndex, // Skicka index för aktuell bild
      });
    }
  }, []);

  useEffect(() => {
    document.title = config.siteTitle; // Justera efter datan om så behövs
  }, []);

  return (
    <div className="container">
      <Suspense
        fallback={
          <>
            <div className="container-header" style={{ height: 130 }} />
            <div className="">
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

            /* ——— detect the transcribe child ——— */
            const onlyTranscribe = matches.some((m) =>
              m.pathname.endsWith("/transcribe")
            );

            /* ---------- show ONLY the editor ---------- */
            if (onlyTranscribe) {
              /* still pass the context for useOutletContext() */
              return <Outlet context={{ data, subrecordsCount }} />;
            }

            /* ---------- normal record screen ---------- */
            document.title = `${getTitleText(data, 0, 0)} – ${
              config.siteTitle
            }`;
            return (
              <article>
                <RecordViewHeader
                  data={data}
                  subrecordsCount={subrecordsCount}
                  location={location}
                />
                <div>
                  <Disclaimer />
                  <div role="group" aria-label="Snabböversikt" className="space-y-0">
                  <RequestToTranscribePrompt data={data} />
                  <RecordViewThumbnails
                    data={data}
                    mediaImageClickHandler={mediaImageClickHandler}
                  />
                  <ContentsElement data={data} highlightData={highlightData?.["media.description"]?.hits?.hits ?? []} />
                  <HeadwordsElement data={data} />
                  </div>
                  <TranscriptionPrompt data={data} />

                  <AudioItems data={data} highlightData={highlightData} />
                  <PdfElement data={data} />
                  <TextElement
                    data={data}
                    highlightData={highlightData}
                    mediaImageClickHandler={mediaImageClickHandler}
                  />
                  <div className="flex flex-col lg:flex-row items-stretch gap-1">
                    <div className="w-full lg:w-2/3 min-w-0">
                      <ReferenceLinks data={data} />
                    </div>
                    <div className="w-full lg:w-1/3">
                      <License data={data} />
                    </div>
                  </div>

                  <SubrecordsElement
                    data={data}
                    subrecordsCount={subrecordsCount}
                    mode={mode}
                  />
                  <PersonItems data={data} routeParams={routeParams} />
                  <PlaceItems data={data} routeParams={routeParams} />
                  <hr />
                  <SimilarRecords data={data} />
                  <hr />
                  <RecordViewFooter data={data} />
                </div>
                <Outlet context={{ data }} />
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
