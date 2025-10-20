import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const SIZE = {
  sm: { dot: "h-6 w-6", icon: "h-4" }, // small
  md: { dot: "h-8 w-8", icon: "h-5" },
};

export function StatusIndicator({
  status,
  size = "sm",
  className,
  positionClass = "absolute top-2 right-2",
}) {
  if (!status) return null;

  const s = SIZE[size] || SIZE.sm;

  return (
    <div
      className={classNames(
        positionClass,
        s.dot,
        "rounded-full flex items-center justify-center text-white shadow",
        "border-2 border-solid border-white",
        status.color,
        className
      )}
      title={status.label}
      aria-label={status.label}
    >
      {status.icon && <FontAwesomeIcon className={s.icon} icon={status.icon} />}
      <span className="sr-only">{status.label}</span>
    </div>
  );
}

StatusIndicator.propTypes = {
  status: PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    icon: PropTypes.any,
  }),
  size: PropTypes.oneOf(["sm", "md"]),
  className: PropTypes.string,
  positionClass: PropTypes.string,
};
