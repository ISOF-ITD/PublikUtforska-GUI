/* eslint-disable react/require-default-props */
import {
  Suspense, useCallback, useEffect, useId
} from 'react';
import PropTypes from 'prop-types';
import {
  Await,
  useLoaderData,
  useLocation,
  Outlet,
  useMatches,
  useAsyncError,
  useRevalidator,
} from "react-router-dom";
import ContentsElement from "./ui/ContentsElement";
import HeadwordsElement from "./ui/HeadwordsElement";
import License from "./ui/License";
import PdfElement from "./ui/PdfElement";
import PersonItems from "./ui/PersonItems";
import RecordViewFooter from "./ui/RecordViewFooter";
import RecordViewHeader from "./ui/RecordViewHeader";
import RecordViewMetadata from './ui/RecordViewMetadata';
import RecordViewActions from './ui/RecordViewActions';
import ReferenceLinks from "./ui/ReferenceLinks";
import RecordTextPanel from "../RecordTextPanel/RecordTextPanel";
import TranscriptionCTA from "./ui/TranscriptionCTA";
import SimilarRecords from "./ui/SimilarRecords";
import { getTitleText } from "../../utils/helpers";
import config from "../../config";
import AudioItems from "../AudioDescription/AudioItems";
import RouteViewLoadingPlaceholder from "../../components/RouteViewLoadingPlaceholder";
import ContributeInfoSection from '../../components/views/ContributeInfoSection';

function RecordView() {
  const { results: resultsPromise } = useLoaderData();
  const location = useLocation();
  const matches = useMatches();

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
    [],
  );

  return (
    <div className="container">
      <Suspense fallback={<LoadingFallback />}>
        <Await resolve={resultsPromise} errorElement={<LoadError />}>
          {(value) => (
            <ResolvedRecord
              value={value}
              matches={matches}
              location={location}
              mediaImageClickHandler={mediaImageClickHandler}
            />
          )}
        </Await>
      </Suspense>
    </div>
  );
}

function LoadingFallback() {
  return <RouteViewLoadingPlaceholder kind="record" inline />;
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
  mediaImageClickHandler,
}) {
  const [highlightData, raw] = value || [];
  const data = raw?._source;
  const titleId = useId();
  const metadataHeadingId = useId();
  const personsHeadingId = useId();
  const reuseHeadingId = useId();
  const licenseHeadingId = useId();
  const recordHighlightHit = highlightData?.data?.[0] ?? {};
  const recordHighlights = recordHighlightHit.highlight ?? {};
  const descriptionHighlights = (
    recordHighlightHit.inner_hits?.['media.description']?.hits?.hits ?? []
  );
  const activeRecordTask = matches.some((match) => match.handle?.task);

  // Set the final title when data is available
  useEffect(() => {
    if (data && !activeRecordTask) {
      document.title = `${getTitleText(data, 0, 0)} – ${config.siteTitle}`;
      return () => {
        // Optional clean-up: reset to site title when leaving the page
        document.title = config.siteTitle;
      };
    }
  }, [activeRecordTask, data]);

  if (!data) return <div>Posten finns inte.</div>;

  if (activeRecordTask) {
    return <Outlet context={{ data }} />;
  }

  return (
    <article aria-labelledby={titleId}>
      <RecordViewHeader
        data={data}
        headingId={titleId}
      />
      <div>
        <div className="record-view-layout">
          <div className="record-view-details min-w-0">
            <section aria-labelledby={metadataHeadingId} className="mb-6">
              <h2 id={metadataHeadingId} className="text-xl font-bold">Metadata</h2>
              <RecordViewMetadata data={data} search={location.search}>
                {Boolean(data.contents) && (
                  <ContentsElement
                    data={data}
                    highlightData={descriptionHighlights}
                    highlightHtml={recordHighlights.contents}
                  />
                )}
                {Boolean(data.headwords) && (
                  <HeadwordsElement
                    data={data}
                    highlightHtml={recordHighlights.headwords}
                  />
                )}
              </RecordViewMetadata>
            </section>
            <RecordViewActions data={data} />
            <TranscriptionCTA data={data} />
          </div>
          <div className="record-view-media min-w-0 space-y-6 empty:hidden">
            <AudioItems data={data} highlightData={highlightData} />
            <RecordTextPanel
              data={data}
              highlightData={highlightData}
              mediaImageClickHandler={mediaImageClickHandler}
            />
            <PdfElement data={data} />
          </div>
        </div>
        <PersonItems data={data} location={location} headingId={personsHeadingId} />

        <section aria-labelledby={reuseHeadingId} className="my-6">
          <h2 id={reuseHeadingId} className="text-xl font-bold">Dela och använda materialet</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            <ReferenceLinks data={data} />
            <section aria-labelledby={licenseHeadingId}>
              <h3 id={licenseHeadingId} className="text-base font-semibold">Licens</h3>
              <License data={data} />
            </section>
          </div>
        </section>
        <ContributeInfoSection
          title={getTitleText(data, 0, 0)}
          type="Uppteckning"
          id={data.id}
          headingLevel="h2"
        />
        <hr />
        <SimilarRecords data={data} />
        <hr />
        <RecordViewFooter data={data} />
      </div>
      <Outlet context={{ data }} />
    </article>
  );
}

ResolvedRecord.propTypes = {
  value: PropTypes.array,
  matches: PropTypes.array.isRequired,
  location: PropTypes.object.isRequired,
  mediaImageClickHandler: PropTypes.func.isRequired,
};

export default RecordView;
