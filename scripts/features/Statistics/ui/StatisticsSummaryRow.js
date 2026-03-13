import PropTypes from 'prop-types';
import ShortStatistics from './ShortStatistics';
import StatisticsSectionHeading from './StatisticsSectionHeading';

export default function StatisticsSummaryRow({
  title,
  monthParams,
  totalParams,
  monthLabel,
  totalLabel,
  shouldFetch,
  valueSource = 'value',
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 sm:w-32 sm:shrink-0">
          <StatisticsSectionHeading>
            {title}
          </StatisticsSectionHeading>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3">
          <ShortStatistics
            params={monthParams}
            label={monthLabel}
            shouldFetch={shouldFetch}
            compact
            valueSource={valueSource}
          />
          <ShortStatistics
            params={totalParams}
            label={totalLabel}
            shouldFetch={shouldFetch}
            compact
            valueSource={valueSource}
          />
        </div>
      </div>
    </section>
  );
}

StatisticsSummaryRow.propTypes = {
  title: PropTypes.string.isRequired,
  monthParams: PropTypes.object.isRequired,
  totalParams: PropTypes.object.isRequired,
  monthLabel: PropTypes.string.isRequired,
  totalLabel: PropTypes.string.isRequired,
  shouldFetch: PropTypes.bool,
  valueSource: PropTypes.oneOf(['value', 'aggresult']),
};
