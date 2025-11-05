import PropTypes from "prop-types";

export default function SegmentPersons({ persons = [] }) {
  if (!persons.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {persons.map((p) => (
        <span
          key={p.id}
          className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
        >
          <span className="font-medium">{p.name}</span>
          {p.relation ? (
            <span className="text-[0.7rem] text-gray-500">({p.relation})</span>
          ) : null}
        </span>
      ))}
    </div>
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
};
