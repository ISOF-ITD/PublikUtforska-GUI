import PropTypes from "prop-types";
import config from "../../config";
import { l } from "../../lang/Lang";

const { hitsPerPage, maxTotal } = config;

export default function Pagination({ currentPage, total, onStep, maxPage }) {
  const from = (currentPage - 1) * hitsPerPage + 1;
  const to = Math.min(currentPage * hitsPerPage, total);

  if (total <= 2) return null;

  return (
    <nav
      className="my-4 flex items-center gap-4 text-sm"
      role="navigation"
      aria-label="paginering"
    >
      <p>
        <strong>{`${l("Visar")} ${from}-${to} ${l(total ? "av" : "")} ${
          total || ""
        }`}</strong>
      </p>

      {total > hitsPerPage && (
        <>
          <button
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
            onClick={() => onStep(-1)}
            type="button"
          >
            {l("Föregående")}
          </button>

          <button
            disabled={currentPage >= maxPage}
            className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
            onClick={() => onStep(1)}
            type="button"
          >
            {l("Nästa")}
          </button>
        </>
      )}

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

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onStep: PropTypes.func.isRequired,
  maxPage: PropTypes.number.isRequired,
};
