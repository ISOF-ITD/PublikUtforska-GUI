/* eslint-disable react/require-default-props */
import { Link, useParams, NavLink } from "react-router-dom";
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
    <nav
      className="nordic-switch-wrapper map-floating-control"
      aria-label={l("Växla mellan arkivmaterial och 'skriva av' läge")}
    >
      <NavLink
        to={`/${sharedRoute}`}
        className={({ isActive }) =>
          isActive || mode === "material" ? "selected" : ""
        }
        end
      >
        {l("Arkivmaterial")}
      </NavLink>
      <NavLink
        to={`/transcribe/${sharedRoute}`}
        className={({ isActive }) =>
          isActive || mode === "transcribe" ? "selected" : ""
        }
      >
        {l("Skriva av")}
      </NavLink>
    </nav>
  );
}
FilterSwitch.propTypes = {
  mode: PropTypes.string,
};
