/* eslint-disable react/require-default-props */
import { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  faChevronLeft,
  faChevronRight,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Folkelogga from "../../img/folke-white.svg";
import { l } from "../lang/Lang";
import config from "../config";
import FilterSwitch from "./FilterSwitch";
import SearchBox from "./SearchBox";
import StatisticsContainer from "./StatisticsContainer";
import TranscribeButton from "./views/transcribe/TranscribeButton";
import RecordList from "../features/RecordList/RecordList";
import classNames from "classnames";

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
  const getIsMobile = () =>
    typeof window !== "undefined" ? window.innerWidth < 700 : false;
  const [isMobile, setIsMobile] = useState(getIsMobile());
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const onResize = () => {
      const mobile = getIsMobile();
      setIsMobile(mobile);
      if (mobile) setExpanded(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const latestParams = useMemo(
    () => ({
      size: 20,
      recordtype: "one_record",
      transcriptionstatus: "published",
      sort: "changedate",
      order: "desc",
    }),
    []
  );
  const PANEL_WIDTH = 422;
  const panelWidth = isMobile
    ? typeof window !== "undefined"
      ? window.innerWidth
      : PANEL_WIDTH // full width on mobile
    : PANEL_WIDTH;
  const TOGGLE_W = 28;

  return (
    <div
      id="mapmenu-panel"
      aria-hidden={!expanded}
      className={classNames(
        "bg-isof flex flex-col print:hidden absolute top-0 bottom-0 w-96 border-r-2 border-white !z-[1201]",
        "pt-5 px-5 items-center transition-all duration-300 ease-in-out pointer-events-auto max-sm:box-border max-sm:w-full max-sm:p-2.5",
        expanded ? "left-0" : "-left-[500px]"
      )}
    >
      {/* <SurveyLink />  enable when needed */}
      {/*<Warning /> */}

      <img src={Folkelogga} alt="Folkelogga" className="h-20 w-full" />

      <FilterSwitch mode={mode} />

      <SearchBox
        params={params}
        mode={mode}
        recordsData={recordsData}
        audioRecordsData={audioRecordsData}
        pictureRecordsData={pictureRecordsData}
        loading={loading}
      />

      <div className="popup-wrapper w-full flex">
        <TranscribeButton
          className=""
          label={
            <>
              <FontAwesomeIcon icon={faPen} />{" "}
              {l("Skriv av slumpmässig uppteckning")}
              {config.specialEventTranscriptionCategoryLabel && <br />}
              {config.specialEventTranscriptionCategoryLabel || ""}
            </>
          }
          random
        />
      </div>
      <div
        className="fixed z-[1999] pointer-events-none will-change-[left,transform] transition-[left,transform] duration-300 ease-in-out"
        style={
          isMobile
            ? {
                left: expanded ? Math.max((panelWidth ?? 0) - TOGGLE_W, 0) : 0,
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
            "pointer-events-auto shadow-md p-0 bg-white w-7 h-12 flex justify-center items-center border-0 focus:outline-none focus-visible:ring focus-visible:lighter-isof",
            isMobile ? (expanded ? "rounded-r" : "rounded-l") : "rounded-r"
          )}
        >
          <FontAwesomeIcon icon={expanded ? faChevronLeft : faChevronRight} />
        </button>
      </div>

      <div className="overflow-y-auto p-4 flex flex-col mb-2 rounded-xl items-stretch h-full bg-white">
        <div>
          <StatisticsContainer />

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
        </div>
      </div>
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
