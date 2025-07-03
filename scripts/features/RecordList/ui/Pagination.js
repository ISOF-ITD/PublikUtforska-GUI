import PropTypes from "prop-types";
import { l } from "../../../lang/Lang";
import config from "../../../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";

const { hitsPerPage, maxTotal } = config;

/* ––––– helpers ––––– */
function buildPageWindow(current, max) {
  if (max <= 7) return [...Array(max)].map((_, i) => i + 1);

  const window = [];
  const add = (p) => window.push(p);

  add(1);
  if (current > 4) add("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(max - 1, current + 1);

  for (let p = start; p <= end; p += 1) add(p);

  if (current < max - 3) add("…");
  add(max);
  return window;
}

export default function Pagination({ currentPage, total, onStep, maxPage }) {
  /* bail-out if everything fits on one page */
  if (total <= hitsPerPage) return null;

  const from = (currentPage - 1) * hitsPerPage + 1;
  const to = Math.min(currentPage * hitsPerPage, total);

  const window = buildPageWindow(currentPage, maxPage);

  return (
    <nav className="my-4 flex flex-col gap-3 text-sm" aria-label="paginering">
      <p>
        <strong>
          {l("Visar")} {from}-{to} {l("av")} {total.toLocaleString("sv-SE")}
        </strong>
      </p>

      <div className="inline-flex flex-wrap items-center align-middle gap-1  w-full">
        {/* PREVIOUS */}
        <PageButton
          disabled={currentPage === 1}
          onClick={() => onStep(-1)}
          label={l("Föregående")}
          icon={faArrowLeft}
        />

        {/* PILL WINDOW */}
        {window.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2">
              …
            </span>
          ) : (
            <PageButton
              key={p}
              active={p === currentPage}
              onClick={() => onStep(p - currentPage)}
              label={p}
            />
          )
        )}

        {/* NEXT */}
        <PageButton
          disabled={currentPage === maxPage}
          onClick={() => onStep(1)}
          label={l("Nästa")}
          icon={faArrowRight}
        />
      </div>

      {total >= maxTotal && currentPage >= maxPage && (
        <span className="text-red-600">
          {l(
            `Du har nått det maximala antalet sidor (${maxTotal.toLocaleString(
              "sv-SE"
            )} poster).`
          )}
        </span>
      )}
    </nav>
  );
}

function PageButton({ label, onClick, disabled, active, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex items-center justify-center gap-2 min-w-10 px-3 py-1 rounded border",
        active
          ? "bg-isof text-white hover:!text-white border-isof"
          : "bg-white hover:bg-gray-100 border-gray-300",
        disabled && "opacity-40 cursor-not-allowed",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-isof",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
      aria-label={
        typeof label === "number" ? `${l("Gå till sida")} ${label}` : label
      }
      aria-disabled={disabled || undefined}
    >
      {icon && <FontAwesomeIcon icon={icon} aria-hidden="true" />}
      {label}
    </button>
  );
}

PageButton.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  active: PropTypes.bool,
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onStep: PropTypes.func.isRequired,
  maxPage: PropTypes.number.isRequired,
};
