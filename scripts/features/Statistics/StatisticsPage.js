import { useEffect } from 'react';
import { l } from '../../lang/Lang';
import StatisticsContainer from './StatisticsContainer';

export default function StatisticsPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${l('Statistik')} – Folke`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <article className="py-8 text-body">
      <header className="mb-6 border-b border-border pb-4">
        <h1 className="!m-0 text-body">{l('Statistik')}</h1>
      </header>
      <StatisticsContainer />
    </article>
  );
}
