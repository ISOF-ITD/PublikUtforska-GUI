import React, { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PropTypes from "prop-types";
import { getTitleText } from "../../utils/helpers";
import config from "../../config";
import CorrectionEditor from "./CorrectionEditor";
import RecordViewHeader from "../RecordView/ui/RecordViewHeader";

function CorrectionView() {
  // RecordView puts these on the outlet context in its “onlyTranscribe” branch
  const { data, subrecordsCount } = useOutletContext();

  /* ---- head ---- */
  useEffect(() => {
    if (data) {
      document.title = `${getTitleText(data, 0, 0)} – ${config.siteTitle}`;
    } else {
      document.title = config.siteTitle;
    }
  }, [data]);

  if (!data) return <div>Posten finns inte.</div>;

  return (
    <article>
      <RecordViewHeader data={data} subrecordsCount={subrecordsCount} />

      <div className="container-body">
        {/* Pass the record data explicitly so the editor never depends on Outlet */}
        <CorrectionEditor data={data} />
      </div>
    </article>
  );
}

CorrectionView.propTypes = {
  mode: PropTypes.string,
};

export default CorrectionView;
