import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";

const STATUS_COLORS = {
  initialized: "text-gray-400",
  edited: "text-yellow-400",
  review: "text-red-400",
  complete: "text-green-500",
};

export default function StatusDot({ status }) {
  return (
    <FontAwesomeIcon
      icon={faCircle}
      className={classNames(
        "w-2 h-2",
        STATUS_COLORS[status] || "text-gray-400"
      )}
    />
  );
}
