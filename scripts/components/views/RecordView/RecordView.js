/* eslint-disable react/require-default-props */
import { Suspense, useCallback, useEffect, useMemo } from "react";
import {
  Await,
  useLoaderData,
  useLocation,
  Outlet,
  useMatches,
  useAsyncError,
  useRevalidator,
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
import PdfElement from "./PdfElement";
import PersonItems from "./PersonItems";
import PlaceItems from "./PlaceItems";
import RecordViewFooter from "./RecordViewFooter";
import RecordViewHeader from "./RecordViewHeader";
import RecordViewThumbnails from "./RecordViewThumbnails";
import ReferenceLinks from "./ReferenceLinks";
import SubrecordsElement from "./SubrecordsElement";
import RecordTextPanel from "../../../features/RecordTextPanel/RecordTextPanel";
import TranscriptionPrompt from "./TranscriptionPrompt";
import SimilarRecords from "./SimilarRecords";
import { getTitleText } from "../../../utils/helpers";
import config from "../../../config";
import AudioItems from "../../../features/AudioDescription/AudioItems";
import Spinner from "../../Spinner";

function RecordView({ mode = "material" }) {
  const { results: resultsPromise } = useLoaderData();
  const location = useLocation();
  const matches = useMatches();

  const routeParams = useMemo(
    () => createSearchRoute(createParamsFromRecordRoute(location.pathname)),
    [location.pathname]
  );

  const mediaImageClickHandler = useCallback(
    (mediaItem, mediaList, currentIndex) => {
      if (typeof window !== "undefined" && window.eventBus) {
        window.eventBus.dispatch("overlay.viewimage", {
          imageUrl: mediaItem.source,
          type: mediaItem.type,
          mediaList,
          currentIndex,
        });
      }
    },
    []
  );

  // Neutral title while the data is loading or if promise is pending
  useEffect(() => {
    document.title = config.siteTitle;
  }, [location.pathname]);

  return (
    <div className="container" aria-busy="true">
      <Suspense fallback={<LoadingFallback />}>
        <Await resolve={resultsPromise} errorElement={<LoadError />}>
          {(value) => (
            <ResolvedRecord
              value={value}
              matches={matches}
              location={location}
              mode={mode}
              routeParams={routeParams}
              mediaImageClickHandler={mediaImageClickHandler}
            />
          )}
        </Await>
      </Suspense>
    </div>
  );
}

function LoadingFallback() {
  return (
    <>
      <div
        className="container-header h-32"
        aria-live="polite"
        aria-busy="true"
      />
      <Spinner className="text-isof" label="Hämtar data…" />
    </>
  );
}

function LoadError() {
  const error = useAsyncError();
  const { revalidate, state } = useRevalidator();

  // Optional: map HTTP-ish errors to friendly copy
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <div role="alert" className="p-3 rounded border border-red-300 bg-red-50">
      <p className="font-semibold">Det gick inte att ladda posten.</p>
      {isOffline ? (
        <p>
          Du verkar vara offline. Kontrollera din uppkoppling och försök igen.
        </p>
      ) : (
        <p>Prova igen. Om felet kvarstår, kontakta supporten.</p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="button button-primary"
          onClick={() => revalidate()}
          disabled={state === "loading"}
        >
          {state === "loading" ? "Försöker…" : "Försök igen"}
        </button>
        <a href="/" className="button button-secondary">
          Till startsidan
        </a>
      </div>
      {process.env.NODE_ENV === "development" && error && (
        <pre className="mt-3 text-xs overflow-auto max-h-40">
          {String(error?.status || "")} {error?.statusText || ""}
          {"\n"}
          {error?.message || ""}
        </pre>
      )}
    </div>
  );
}

function ResolvedRecord({
  value,
  matches,
  location,
  mode,
  routeParams,
  mediaImageClickHandler,
}) {
  const [highlightData, raw, sub] = value || [];
  const data = raw?._source;
  const subrecordsCount = sub?.data;

  // Set the final title when data is available
  useEffect(() => {
    if (data) {
      document.title = `${getTitleText(data, 0, 0)} – ${config.siteTitle}`;
      return () => {
        // Optional clean-up: reset to site title when leaving the page
        document.title = config.siteTitle;
      };
    }
  }, [data]);

  if (!data) return <div>Posten finns inte.</div>;

  const onlyTranscribe = matches.some((m) =>
    m.pathname.endsWith("/transcribe")
  );
  if (onlyTranscribe) {
    return <Outlet context={{ data, subrecordsCount }} />;
  }

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
          <RecordViewThumbnails
            data={data}
            mediaImageClickHandler={mediaImageClickHandler}
          />
          <ContentsElement
            data={data}
            highlightData={
              highlightData?.["media.description"]?.hits?.hits ?? []
            }
          />
          <HeadwordsElement data={data} />
        </div>

        <TranscriptionPrompt data={data} />
        <AudioItems data={data} highlightData={highlightData} />
        <PdfElement data={data} />
        <RecordTextPanel
          data={data}
          highlightData={highlightData}
          mediaImageClickHandler={mediaImageClickHandler}
        />

        <div className="flex flex-col lg:flex-row gap-2 my-6 items-stretch">
            <ReferenceLinks data={data} />
            <License data={data} />
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
}

RecordView.propTypes = {
  mode: PropTypes.string,
};

export default RecordView;
