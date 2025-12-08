/* eslint-disable react/require-default-props */
import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useLocation, Link } from "react-router-dom";
import PropTypes from "prop-types";
import ContributeInfoButton from "./ContributeInfoButton";
import SimpleMap from "./SimpleMap";
import FeedbackButton from "./FeedbackButton";
import { l } from "../../lang/Lang";

import config from "../../config";
import RecordList from "../../features/RecordList/RecordList";

export default function PersonView({ mode = "material" }) {
  const {
    biography = "",
    birthplace,
    birth_year: birthYear,
    id,
    imagepath,
    name = "",
    places = [],
  } = useLoaderData() || {};

  const location = useLocation();

  // Keep document title friendly & restore on unmount
  useEffect(() => {
    const prevTitle = document.title;
    document.title = name ? `${name} - ${config.siteTitle}` : config.siteTitle;
    return () => {
      document.title = prevTitle;
    };
  }, [name]);

  // First place (if any)
  const personPlace = places?.[0];

  // Human-friendly county/region label
  const personCounty = useMemo(() => {
    if (!personPlace) return "";
    const parts = [personPlace.name];
    if (personPlace.landskap) parts.push(personPlace.landskap);
    if (personPlace.fylke) parts.push(personPlace.fylke); // backwards compat
    return parts.filter(Boolean).join(", ");
  }, [personPlace]);

  // Optional Nordic suffix (kept compatible with existing setting)
  const nordicSuffix = useMemo(() => {
    try {
      return window?.applicationSettings?.includeNordic ? "/nordic/true" : "";
    } catch {
      return "";
    }
  }, []);

  const hasCoords = Boolean(personPlace?.lat && personPlace?.lng);

  // Biography teaser
  const [bioExpanded, setBioExpanded] = useState(false);
  const bioText = (biography || "").trim();
  const BIO_PREVIEW_CHARS = 420;
  const needsTruncate = bioText.length > BIO_PREVIEW_CHARS;
  const bioToShow =
    bioExpanded || !needsTruncate
      ? bioText
      : `${bioText.slice(0, BIO_PREVIEW_CHARS)}…`;

  const recordListParams = useMemo(
    () => ({
      person_id: id,
      has_untranscribed_records: mode === "transcribe" ? "true" : null,
      transcriptionstatus:
        mode === "transcribe" ? null : "published,accession,readytocontribute,readytotranscribe",
    }),
    [id, mode]
  );

  return (
    <div className={`container${id ? "" : " loading"}`}>
      <div className="container-header">
        <div className="row">
          <div className="twelve columns">
            <h1 className="person-title">{name}</h1>

            {(birthYear > 0 || personPlace || birthplace) && (
              <p className="person-subtitle">
                {l("Föddes")}
                {birthYear > 0 && ` ${birthYear}`}
                {(personPlace || birthplace) && " i "}
                {personPlace ? (
                  <Link to={`/places/${personPlace.id}${nordicSuffix}`}>
                    {personCounty}
                  </Link>
                ) : (
                  birthplace
                )}
              </p>
            )}
          </div>
        </div>

        {!config.siteOptions.hideContactButton && (
          <div
            className="action-bar"
            role="group"
            aria-label={l("Hjälp oss förbättra sidan")}
          >
            <FeedbackButton
              title={name}
              type="Person"
              location={location}
              country="sweden"
            />
            <ContributeInfoButton
              title={name}
              type="Person"
              location={location}
            />
          </div>
        )}
      </div>

      {hasCoords && (
        <div className="row">
          <div className="twelve columns">
            <SimpleMap
              marker={{
                lat: personPlace.lat,
                lng: personPlace.lng,
                label: personPlace.name,
              }}
            />
          </div>
        </div>
      )}

      <div className="row">
        <div className={`${imagepath ? "eight" : "twelve"} columns`}>
          {bioText && (
            <>
              <p
                id="bio-text"
                className="bio-text"
                style={{ whiteSpace: "pre-line" }}
              >
                {bioToShow}
              </p>
              {needsTruncate && (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setBioExpanded((v) => !v)}
                  aria-expanded={bioExpanded}
                  aria-controls="bio-text"
                >
                  {bioExpanded ? l("Visa mindre") : l("Läs mer")}
                </button>
              )}
            </>
          )}
        </div>

        {imagepath && (
          <div className="four columns">
            <figure>
              <img
                className="archive-image"
                src={(config.personImageUrl || config.imageUrl) + imagepath}
                alt={name || l("Porträtt")}
                loading="lazy"
                decoding="async"
              />
              {name && (
                <figcaption className="image-caption">{name}</figcaption>
              )}
            </figure>
          </div>
        )}
      </div>

      <hr />

      <div className="row">
        <div className="twelve columns">
          <div
            className="record-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <h3 id="records">{l(`Arkivmaterial kopplat till ${name}`)}</h3>
          </div>

          <RecordList
            disableRouterPagination
            disableAutoFetch
            showViewToggle={false}
            params={recordListParams}
            mode={mode}
            hasFilter={mode !== "transcribe"}
          />
        </div>
      </div>
    </div>
  );
}

PersonView.propTypes = {
  mode: PropTypes.string,
};
