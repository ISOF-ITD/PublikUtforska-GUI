import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import classNames from "classnames";

export default function IconButton({ icon, label, className, ...btnProps }) {
  return (
    <button
      {...btnProps}
      aria-label={label}
      title={label}
      className={classNames(
        "p-2 rounded focus-visible:ring-2 focus-visible:ring-isof focus:outline-none",
        className,
      )}
    >
      <FontAwesomeIcon icon={icon} className="w-3 h-3" />
    </button>
  );
}

IconButton.propTypes = {
  icon: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
};
