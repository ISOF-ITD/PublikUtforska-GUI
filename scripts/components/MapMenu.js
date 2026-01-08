/* eslint-disable react/require-default-props */
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  faChevronLeft,
  faChevronRight,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Folkelogga from "../../img/folke-white.svg";
import { l } from "../lang/Lang";
import SearchPanel from "../features/Search/SearchPanel";
import StatisticsContainer from "./StatisticsContainer";
import RecordList from "../features/RecordList/RecordList";
import classNames from "classnames";
import IntroOverlay from "./views/IntroOverlay";
import config from "../config";

// Helpers
function SurveyLink() {
  const openSurvey = () =>
    window.open("https://www.isof.se/enkat-folke", "_blank");
  return (
    <button
      type="button"
      onClick={openSurvey}
      onKeyDown={(e) => ["Enter", " "].includes(e.key) && openSurvey()}
      style={{
        backgroundColor: "#3ed494",
        padding: "1.2rem 1rem 1.1rem",
        textAlign: "center",
        borderRadius: 13,
        marginBottom: 10,
        cursor: "pointer",
        textDecoration: "underline",
        width: "100%",
      }}
    >
      Användarenkät Folke 2023
    </button>
  );
}

function Warning() {
  const [html, setHtml] = useState("");
  useEffect(() => {
    fetch("/varning.html")
      .then((r) => (r.ok ? r.text() : null))
      .then(setHtml);
  }, []);
  return html ? (
    <div
      role="alert"
      aria-label="Varning"
      style={{
        backgroundColor: "#ffc107",
        padding: "1.2rem 1rem 1.1rem",
        textAlign: "center",
        borderRadius: 13,
        marginBottom: 10,
      }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : null;
}

// Component

export default function MapMenu({
  mode = "material",
  params,
  recordsData = { data: [], metadata: {} },
  audioRecordsData = { data: [], metadata: {} },
  pictureRecordsData = { data: [], metadata: {} },
  loading,
}) {
  // --- Track a "just switched mode" window
  const prevModeRef = useRef(mode);
  const [justSwitched, setJustSwitched] = useState(false);
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      if (prevModeRef.current === mode) return;
      prevModeRef.current = mode;
      setJustSwitched(true);
      const t = setTimeout(() => setJustSwitched(false), 400);
      return () => clearTimeout(t);
    }
  }, [mode]);

  // Remember last good data (so totals & list button don’t vanish)
  const lastGoodRef = useRef({
    recordsData,
    audioRecordsData,
    pictureRecordsData,
  });
  const anyTotals =
    (recordsData?.metadata?.total?.value ?? 0) +
    (audioRecordsData?.metadata?.total?.value ?? 0) +
    (pictureRecordsData?.metadata?.total?.value ?? 0);
  useEffect(() => {
    if (anyTotals > 0) {
      lastGoodRef.current = {
        recordsData,
        audioRecordsData,
        pictureRecordsData,
      };
    }
  }, [anyTotals, recordsData, audioRecordsData, pictureRecordsData]);

  // While switching (and only for a short time), keep showing last good data
  const stable =
    justSwitched && loading
      ? lastGoodRef.current
      : {
          recordsData,
          audioRecordsData,
          pictureRecordsData,
        };
  // Debounce loading inside the panel to prevent gray flash
  const [panelLoading, setPanelLoading] = useState(!!loading);
  useEffect(() => {
    let t;
    // During the brief "justSwitched" phase, don’t show loading at all
    if (justSwitched && loading) {
      setPanelLoading(false);
      return;
    }
    if (loading) t = setTimeout(() => setPanelLoading(true), 150);
    else setPanelLoading(false);
    return () => clearTimeout(t);
  }, [loading, justSwitched]);
  const location = useLocation();
  const initialLoad = useRef(true);
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const activateIntroOverlay = Boolean(config?.activateIntroOverlay);
  const getIsMobile = () =>
    typeof window !== "undefined" ? window.innerWidth < 700 : false;
  const [isMobile, setIsMobile] = useState(getIsMobile());
  const [expanded, setExpanded] = useState(true);
  const [toggleW, setToggleW] = useState(64);
  const toggleRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      const mobile = getIsMobile();
      setIsMobile(mobile);
      if (mobile) setExpanded(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const measure = () => {
      const w = toggleRef.current?.getBoundingClientRect().width || 64;
      setToggleW(w);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const latestParams = useMemo(
    () => ({
      size: 20,
      // In requiredParams in config.js:
      // recordtype: "one_accession_row",
      transcriptionstatus: "published",
      sort: "changedate",
      order: "desc",
    }),
    []
  );

  // Auto-open on first load, on root path, with no hash,
  // and only if the feature is enabled in config.
  useEffect(() => {
    if (!activateIntroOverlay) return;
    const isRoot = location.pathname === "/";
    const noHash = !location.hash || location.hash === "#/";
    // detect shared/deep-linked intro content
    const params = new URLSearchParams(location.search);
    const hasK = params.has("k") && params.get("k") !== "";

    const SEEN_KEY = "folke:introSeen:v1";
    const hasSeen =
      typeof window !== "undefined" && localStorage.getItem(SEEN_KEY) === "1";
    if (initialLoad.current && isRoot && noHash) {
      // If there’s a k=... in the URL, always open the intro, even if user saw it before
      if (hasK || !hasSeen) {
        setShowIntroOverlay(true);
      }
    }
    initialLoad.current = false;
  }, [location, activateIntroOverlay]);

  const handleShowIntro = useCallback(() => {
    if (activateIntroOverlay) setShowIntroOverlay(true);
  }, [activateIntroOverlay]);
  const handleCloseOverlay = useCallback(() => {
    setShowIntroOverlay(false);
    try {
      localStorage.setItem("folke:introSeen:v1", "1");
    } catch {}
  }, []);

  const PANEL_WIDTH = 422;
  const panelWidth = isMobile
    ? typeof window !== "undefined"
      ? window.innerWidth
      : PANEL_WIDTH // full width on mobile
    : PANEL_WIDTH;

  return (
    <div
      id="mapmenu-panel"
      aria-label="Sök och filter"
      aria-hidden={!expanded}
      className={classNames(
        "bg-isof flex flex-col print:hidden absolute top-0 bottom-0 w-96 border-r-2 border-white !z-[1201]",
        "pt-5 px-5 items-center transition-all duration-300 ease-in-out max-sm:box-border max-sm:w-full max-sm:p-2.5",
        expanded
          ? "left-0 pointer-events-auto"
          : "-left-[500px] pointer-events-none"
      )}
    >
      {/* <SurveyLink />  enable when needed */}
      {/*<Warning /> */}

      <img src={Folkelogga} alt="Folkelogga" className="h-20 w-full" />

      <SearchPanel
        params={params}
        mode={mode}
        recordsData={stable.recordsData}
        audioRecordsData={stable.audioRecordsData}
        pictureRecordsData={stable.pictureRecordsData}
        loading={panelLoading}
        onOpenIntroOverlay={handleShowIntro}
      />

      <div
        className="fixed z-[1999] pointer-events-none will-change-[left,transform] transition-[left,transform] duration-300 ease-in-out"
        style={
          isMobile
            ? {
                left: expanded ? Math.max((panelWidth ?? 0) - toggleW, 0) : 0,
                top: 8,
                transform: "none",
              }
            : {
                left: expanded ? PANEL_WIDTH : 0,
                top: "30%",
                transform: "translateY(-50%)",
              }
        }
      >
        <button
          onClick={() => setExpanded((e) => !e)}
          type="button"
          aria-expanded={expanded}
          aria-controls="mapmenu-panel"
          aria-label={expanded ? l("Dölj meny") : l("Visa meny")}
          title={expanded ? l("Dölj meny") : l("Visa meny")}
          className={classNames(
            "pointer-events-auto shadow-md bg-white backdrop-blur-sm border border-gray-200",
            "w-12 h-12 flex justify-center gap-2 items-center rounded-r",
            isMobile ? (expanded ? "rounded-r" : "rounded-l") : "rounded-r"
          )}
          style={{ touchAction: "manipulation" }}
        >
          <FontAwesomeIcon
            icon={expanded ? faChevronLeft : faChevronRight}
            aria-hidden="true"
          />
          <span className="transform rotate-90">
            {expanded ? l("Dölj") : l("Visa")}
          </span>
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {expanded ? l("Meny öppen") : l("Meny stängd")}
        </span>
      </div>
      {/*<div className="w-full bg-gray-300 text-center py-2 gap-2 rounded-sm">
        <FontAwesomeIcon icon={faClock} /> {"   "}
        Data uppdateras...
      </div>
      */}
      <div
        className="overflow-y-auto w-full min-w-0 max-w-full p-3 flex flex-col mb-2 rounded-xl items-stretch h-full bg-white"
      >
        <div>
          <StatisticsContainer />
          {/* Adapt to new page by page transcription:
          <h3 className="!my-2">Senast avskrivna uppteckningar</h3>
          <div>
            <RecordList
              key="latest-RecordList"
              showViewToggle={false}
              disableRouterPagination
              disableListPagination
              disableListDownload
              smallTitle
              columns={["title", "year", "place", "transcribedby"]}
              params={latestParams}
              interval={60_000}
            />
          </div>
          */}
        </div>
      </div>

      {activateIntroOverlay && (
        <IntroOverlay
          id="intro-overlay"
          show={showIntroOverlay}
          onClose={handleCloseOverlay}
        />
      )}
    </div>
  );
}

MapMenu.propTypes = {
  mode: PropTypes.string,
  params: PropTypes.object.isRequired,
  recordsData: PropTypes.object,
  audioRecordsData: PropTypes.object,
  pictureRecordsData: PropTypes.object,
  loading: PropTypes.bool.isRequired,
};
