import React, { Suspense, useEffect } from "react";
import { Await, useLoaderData } from "react-router-dom";
import PropTypes from "prop-types";

import loaderSpinner from "../../../img/loader.gif";
import RecordViewHeader from "../../components/views/RecordView/RecordViewHeader";
import { getTitleText } from "../../utils/helpers";
import config from "../../config";
import CorrectionEditor from "./CorrectionEditor";

function CorrectionView() {
  // loader delivers a promise tuple: [highlight, { _source: data }, { data: subrecordsCount }]
  const { results: resultsPromise } = useLoaderData();

  /* ---- head ---- */
  useEffect(() => {
    document.title = config.siteTitle;
  }, []);

  return (
    <div className="">
      <Suspense
        fallback={
          <>
            <div className="container-header" style={{ height: 130 }} />
            <div className="container-body flex justify-center py-12">
              <img
                src={loaderSpinner}
                alt="Hämtar data"
                className="w-8 h-8 animate-spin"
              />
            </div>
          </>
        }
      >
        <Await
          resolve={resultsPromise}
          errorElement={<div>Det uppstod ett fel vid laddning av posten.</div>}
        >
          {([, { _source: data }, { data: subrecordsCount }]) => {
            if (!data) return <div>Posten finns inte.</div>;

            // set specific document title once data is here
            document.title = `${getTitleText(data, 0, 0)} – ${config.siteTitle}`;

            return (
              <article>
                <RecordViewHeader
                  data={data}
                  subrecordsCount={subrecordsCount}
                />

                <div className="container-body">
                  {/* pass data as a prop so the editor doesn’t rely on Outlet context */}
                  <CorrectionEditor data={data} />
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
