import PropTypes from 'prop-types';

export default function StatisticsSectionHeading({ children, className = '' }) {
  return (
    <h2 className={`m-0 font-barlow text-xl font-bold text-slate-900 ${className}`.trim()}>
      {children}
    </h2>
  );
}

StatisticsSectionHeading.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
