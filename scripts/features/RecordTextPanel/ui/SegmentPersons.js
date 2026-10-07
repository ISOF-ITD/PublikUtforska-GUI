import PropTypes from "prop-types";

export default function SegmentPersons({ persons = [], maxVisible = 3 }) {
  if (!persons.length) return null;

  const visiblePersons = persons.slice(0, maxVisible);
  const hiddenCount = persons.length - visiblePersons.length;

  return (
    <ul aria-label="Personer i avsnittet" className="!m-0 !p-0 !list-none flex flex-wrap gap-2 items-center">
      {visiblePersons.map((p) => (
        <li
          key={p.id}
          className="inline-flex items-center gap-1 bg-surface-hover text-body text-xs px-2 py-1 rounded-full"
        >
          <span className="font-medium">{p.name}</span>
          {p.relation ? (
            <span className="text-[0.7rem] text-subtle">({p.relation})</span>
          ) : null}
        </li>
      ))}

      {hiddenCount > 0 && (
        <li className="inline-flex items-center bg-surface-active text-muted text-xs px-2 py-1 rounded-full">
          <span aria-hidden="true">{`+${hiddenCount}`}</span>
          <span className="sr-only">{`${hiddenCount} ytterligare personer`}</span>
        </li>
      )}
    </ul>
  );
}

SegmentPersons.propTypes = {
  persons: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      relation: PropTypes.string,
    })
  ),
  maxVisible: PropTypes.number,
};
