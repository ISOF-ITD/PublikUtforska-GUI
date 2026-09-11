import PropTypes from 'prop-types';

export default function AudioWaveIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 48 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2.5"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 14v4 M7 11v10 M11 13v6 M15 8v16 M19 11v10 M23 5v22 M27 12v8 M31 9v14 M35 13v6 M39 11v10 M43 14v4" />
    </svg>
  );
}

AudioWaveIcon.propTypes = {
  className: PropTypes.string,
};
