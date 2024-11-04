/* eslint-disable react/prop-types */
export default function HighlightSwitcher({ highlight, setHighlight }) {
  return (
    <label htmlFor="highlight">
      <input
        type="checkbox"
        id="highlight"
        checked={highlight}
        onChange={() => setHighlight(!highlight)}
      />
      <span style={{ marginLeft: 10 }}>Markera sökord</span>
    </label>

  );
}
