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
  const [expanded, setExpanded] = useState(!getIsMobile());

  useEffect(() => {
    const onResize = () => {
      const mobile = getIsMobile();
      setIsMobile(mobile);
      if (mobile) setExpanded(false);
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

  return (
    <div
     id="mapmenu-panel"
     aria-hidden={!expanded}
      className={`menu-wrapper ${
        expanded ? "menu-expanded" : "menu-collapsed"
      }`}
    >
      {/* <SurveyLink />  enable when needed */}
      <Warning />

      <img
        src={Folkelogga}
        alt="Folkelogga"
        style={{ height: 80, width: "100%" }}
      />

      <FilterSwitch mode={mode} />

      <SearchBox
        params={params}
        mode={mode}
        recordsData={recordsData}
        audioRecordsData={audioRecordsData}
        pictureRecordsData={pictureRecordsData}
        loading={loading}
      />

      <div className="popup-wrapper">
        <TranscribeButton
          className="popup-open-button visible ignore-expand-menu"
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
      <div className="mapmenu-trigger-button">
        <button
          onClick={() => setExpanded((e) => !e)}
          type="button"
          aria-expanded={expanded}
          aria-controls="mapmenu-panel"
          aria-label={expanded ? l("Dölj meny") : l("Visa meny")}
          title={expanded ? l("Dölj meny") : l("Visa meny")}
        >
          <FontAwesomeIcon icon={expanded ? faChevronLeft : faChevronRight} />
        </button>
      </div>

      <div className="puffar">
        <div className="statistics puff">
          <StatisticsContainer />

          <h3>Senast avskrivna uppteckningar</h3>
          <div className="statistics-table">
            <RecordList
              key="latest-RecordList"
              disableRouterPagination
              disableListPagination
              disableListDownload
              smallTitle
              tableClass="table-compressed"
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
