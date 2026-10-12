import PropTypes from 'prop-types';

const SPEEDS = [0.5, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2];

export default function SpeedSelector({ id, speed, onChange }) {
  return (
    <label htmlFor={id} className="block text-sm font-semibold text-player-text">
      <span className="mb-2 block">Uppspelningshastighet</span>
      <select
        id={id}
        value={speed}
        onChange={(event) => onChange(Number(event.target.value))}
        className="box-border min-h-11 w-full cursor-pointer rounded border border-solid border-player-muted bg-player-text text-player-bg [color-scheme:light]
             pl-3 pr-8 text-sm font-medium focus-visible:ring-2
             focus-visible:outline-none focus-visible:ring-player-focus
             focus-visible:ring-offset-2 focus-visible:ring-offset-player-bg !mb-0"
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s} className="bg-player-text text-player-bg">
            {s.toLocaleString('sv-SE')}
            x
          </option>
        ))}
      </select>
    </label>
  );
}

SpeedSelector.propTypes = {
  id: PropTypes.string.isRequired,
  speed: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
