import classNames from 'classnames';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { l } from '../lang/Lang';
import {
  createParamsFromSearchRoute,
  createSearchRoute,
} from "../utils/routeHelper";

const renderLabel = (label, isSelected) => (
  <>
    {isSelected && <span aria-hidden="true" className="sr-only">[Aktiv] </span>}
    {l(label)}
  </>
);

export default function FilterSwitch({ mode = "material" }) {
  const params = useParams();
  const sharedRoute = createSearchRoute(
    createParamsFromSearchRoute(params["*"])
  ).replace(/^\//, "");

  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  // segmented-control container
  const container = classNames(
    "sticky top-0 z-[1400]",
    "bg-transparent backdrop-blur",
    "transition-opacity duration-200",
    ready ? "opacity-100" : "opacity-0",
    "flex flex-row justify-center w-full"
  );

  // shared button styles
  const base = [
    "flex items-center justify-center",
    "h-12 w-2/5",
    "px-3 font-medium",
    "transition-colors duration-200 no-underline hover:underline",
  ].join(" ");

  const unselected = 'bg-neutral-300 text-black hover:bg-neutral-400';
  const selected = 'bg-neutral-100 text-black hover:bg-neutral-150 font-semibold';

  return (
    <nav
      aria-label={l("Växla mellan arkivmaterial och 'skriva av' läge")}
      className={container}
    >
      <NavLink
        to={`/${sharedRoute}`}
        end
        className={({ isActive }) =>
          [base, isActive || mode === "material" ? selected : unselected].join(
            " "
          )
        }
      >
        {({ isActive }) => renderLabel('Arkivmaterial', isActive || mode === 'material')}
      </NavLink>

      <NavLink
        to={`/transcribe/${sharedRoute}`}
        className={({ isActive }) =>
          [
            base,
            isActive || mode === "transcribe" ? selected : unselected,
          ].join(" ")
        }
      >
        {({ isActive }) => renderLabel('Skriva av', isActive || mode === 'transcribe')}
      </NavLink>
    </nav>
  );
}

FilterSwitch.propTypes = {
  mode: PropTypes.string,
};
