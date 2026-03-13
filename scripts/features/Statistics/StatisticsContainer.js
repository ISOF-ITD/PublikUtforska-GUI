import { useState, useEffect, useMemo } from 'react';
import StatisticsSummaryRow from './ui/StatisticsSummaryRow';
import StatisticsList from './ui/StatisticsList';
import config from '../../config';
import { l } from '../../lang/Lang';

export default function StatisticsContainer() {
  const [currentMonth, setCurrentMonth] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadCurrentMonth = async () => {
      try {
        const res = await fetch(`${config.apiUrl}current_time`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('current_time fetch failed');
        const json = await res.json();
        const month = new Date(json.data).toLocaleString('sv-SE', {
          month: 'long',
        });
        setCurrentMonth(month);
      } catch (e) {
        if (e.name !== 'AbortError') {
          setCurrentMonth(
            new Date().toLocaleString('sv-SE', { month: 'long' }),
          );
        }
      }
    };

    loadCurrentMonth();
    const intervalId = setInterval(loadCurrentMonth, 60 * 60 * 1000);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, []);

  const monthOrFallback = currentMonth || l('denna månad');
  const base = useMemo(
    () => ({ media_transcriptionstatus: 'published' }),
    [],
  );
  const monthRange = 'transcriptiondate,now/M,now+2h';

  const pMonthPages = useMemo(
    () => ({
      ...base,
      mediarange: monthRange,
      aggregation: 'sum,archive.total_pages',
    }),
    [base],
  );

  return (
    <div className="flex flex-col gap-4">
      <StatisticsSummaryRow
        title={l('Avskrivna sidor')}
        monthParams={pMonthPages}
        totalParams={{ ...base, aggregation: 'sum,archive.total_pages' }}
        monthLabel={l('denna månad')}
        totalLabel={l('totalt')}
        shouldFetch
      />

      <StatisticsSummaryRow
        title={l('Bidragsgivare')}
        monthParams={{
          ...base,
          mediarange: monthRange,
          aggregation: 'cardinality,transcribedby.keyword',
        }}
        totalParams={{
          ...base,
          aggregation: 'cardinality,transcribedby.keyword',
        }}
        monthLabel={l('denna månad')}
        totalLabel={l('totalt')}
        shouldFetch
        valueSource="aggresult"
      />

      <StatisticsList
        params={{ ...base, mediarange: monthRange }}
        type="topTranscribersByPages"
        label={`Topplista bidragsgivare i ${monthOrFallback}`}
        shouldFetch
      />

      <StatisticsList
        params={{ ...base }}
        type="topTranscribersByPages"
        label="Topplista bidragsgivare totalt"
        shouldFetch
      />
    </div>
  );
}
