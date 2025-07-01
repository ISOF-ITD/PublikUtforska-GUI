/* eslint-disable react/require-default-props */
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { l } from "../lang/Lang";
import {
  createParamsFromSearchRoute,
  createSearchRoute,
} from "../utils/routeHelper";

export default function FilterSwitch({ mode = "material" }) {
  const params = useParams();
  const sharedRoute = createSearchRoute(
    createParamsFromSearchRoute(params["*"])
  ).replace(/^\//, "");

  return (
    <div
      className="nordic-switch-wrapper map-floating-control"
      role="tablist"
      aria-label="Växla mellan arkivmaterial och 'skriva av' läge"
    >
      <Link
        to={`/${sharedRoute}`}
        className={mode === "material" ? "selected" : ""}
      >
        {l("Arkivmaterial")}
      </Link>
      <Link
        to={`/transcribe/${sharedRoute}`}
        className={mode === "transcribe" ? "selected" : ""}
      >
        {l("Skriva av")}
      </Link>
    </div>
  );
}

FilterSwitch.propTypes = {
  mode: PropTypes.string,
};
