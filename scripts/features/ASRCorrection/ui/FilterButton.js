import classNames from "classnames";

export default function FilterButton({ label, value, filter, setFilter }) {
  <button
    onClick={() => setFilter(value)}
    className={classNames(
      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isof",
      filter === value
        ? "bg-isof text-white"
        : "hover:bg-gray-200 text-gray-700"
    )}
  >
    {label}
  </button>;
}
