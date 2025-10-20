import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAsterisk,
  faCheck,
  faLock,
  faNewspaper,
  faPen,
} from "@fortawesome/free-solid-svg-icons";

const SIZE = {
  sm: { dot: "h-6 w-6", icon: "h-4" }, // small
  md: { dot: "h-8 w-8", icon: "h-5" },
};

export function computeStatus(obj = {}) {
  const { isSent, unsavedChanges, transcriptionstatus } = obj;

  if (!isSent && unsavedChanges) {
    return {
      key: "unsaved",
      label: "Sidan har redigerats",
      color: "bg-orange-500",
      icon: faAsterisk,
    };
  }
  if (isSent) {
    return {
      key: "sent",
      label: "Sidan har skickats",
      color: "bg-green-600",
      icon: faCheck,
    };
  }
  if (!isSent && transcriptionstatus === "transcribed") {
    return {
      key: "transcribed",
      label: "Sidan kontrolleras",
      color: "bg-gray-400",
      icon: faLock,
    };
  }
  if (!isSent && transcriptionstatus === "published") {
    return {
      key: "published",
      label: "Sidan har publicerats",
      color: "bg-isof",
      icon: faNewspaper,
    };
  }
  if (transcriptionstatus === "readytotranscribe") {
    return {
      key: "ready",
      label: "Sidan kan skrivas av",
      color: "bg-lighter-isof",
      icon: faPen,
    };
  }
  return null;
}

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
