import classNames from "classnames";

// helper: make the search term bold inside any string
export const highlight = (text, needle = "") => {
  if (!needle) return text;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "gi")).map((part, i) => (
    <span
      key={i}
      className={classNames(
        part.toLowerCase() === needle.toLowerCase()
          ? "font-bold"
          : "font-normal",
        part.toLowerCase() === needle.toLowerCase()
          ? "bg-yellow-100 rounded-sm"
          : ""
      )}
    >
      {part}
    </span>
  ));
};
