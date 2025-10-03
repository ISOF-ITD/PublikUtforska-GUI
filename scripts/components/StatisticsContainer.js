import { useState, useEffect, useRef } from 'react';
import ShortStatistics from './ShortStatistics';
import StatisticsList from './StatisticsList';
import config from '../config';
import { l } from '../lang/Lang';

export default function StatisticsContainer() {
  const firstStatValueRef = useRef(null);
  const [dataChanged, setDataChanged] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('');

  // Funktion för att hantera förändring i första statistiken
  const compareAndUpdateStat = (newValue) => {
    // console.log("----\nJämför gammalt och nytt värde...");
    if (firstStatValueRef.current !== newValue) {
      // console.log(`De är olika! förut ${firstStatValueRef.current}, men nu ${newValue}. sätter dataChanged till true.`);
      firstStatValueRef.current = newValue;
      setDataChanged(true);
    }
  };

  useEffect(() => {
    if (dataChanged) {
      // Återställ flaggan efter att andra komponenter har fått hämta data
      // console.log("Återställer dataChanged till false.")
      setDataChanged(false);
    }
  }, [dataChanged]);

  useEffect(() => {
    // fetch "current_month" from server.
    // the path is the api address plus "current_time", and the result is a json object with a
    // "data" property that contains the current date and time as milliseconds since 1970-01-01
    // the variable current_month's value is the month's name in Swedish for that timestamp
    // only fetch once, when the component is mounted
    fetch(`${config.apiUrl}current_time`)
      .then((response) => response.json())
      .then((data) => {
        setCurrentMonth(new Date(data.data).toLocaleString('sv-SE', { month: 'long' }));
      });
  }, []);

  return (
    <div className="statistics-container">
      {/* Första ShortStatistics som hämtar data när dataChanged är true */}
      <ShortStatistics
        params={{
          recordtype: 'one_record',
          transcriptionstatus: 'published',
          range: 'transcriptiondate,now/M,now+2h',
        }}
        label={`avskrivna uppteckningar i ${currentMonth || l("denna månad")}`}
        shouldFetch={dataChanged}
      />

      {/* Andra ShortStatistics som hämtar data varje minut */}
      <ShortStatistics
        params={{
          recordtype: 'one_record',
          transcriptionstatus: 'published',
        }}
        label="avskrivna uppteckningar totalt"
        compareAndUpdateStat={compareAndUpdateStat}
      />

      {/* Övriga ShortStatistics och StatisticsList som hämtar data när dataChanged är true */}
      <ShortStatistics
        params={{
          recordtype: 'one_record',
          transcriptionstatus: 'published',
          range: 'transcriptiondate,now/M,now+2h',
          aggregation: 'sum,archive.total_pages',
        }}
        label={`avskrivna sidor i ${currentMonth}`}
        shouldFetch={dataChanged}
      />

      <ShortStatistics
        params={{
          recordtype: 'one_record',
          transcriptionstatus: 'published',
          aggregation: 'sum,archive.total_pages',
        }}
        label="avskrivna sidor totalt"
        shouldFetch={dataChanged}
      />

      <ShortStatistics
        params={{
          recordtype: 'one_record',
          transcriptionstatus: 'published',
          range: 'transcriptiondate,now/M,now+2h',
          aggregation: 'cardinality,transcribedby.keyword',
        }}
        label={`användare som har skrivit av uppteckningar i ${currentMonth}`}
        shouldFetch={dataChanged}
      />

      <ShortStatistics
        params={{
          recordtype: 'one_record',
          transcriptionstatus: 'published',
          aggregation: 'cardinality,transcribedby.keyword',
        }}
        label="användare som har skrivit av uppteckningar totalt"
        shouldFetch={dataChanged}
      />

      <StatisticsList
        params={{
          recordtype: 'one_record',
          transcriptionstatus: 'published',
          range: 'transcriptiondate,now/M,now+2h',
        }}
        type="topTranscribersByPages"
        label={`Topplista transkriberare i ${currentMonth}`}
        shouldFetch={dataChanged}
      />

      <StatisticsList
        params={{
          recordtype: 'one_record',
          transcriptionstatus: 'published',
        }}
        type="topTranscribersByPages"
        label="Topplista transkriberare totalt"
        shouldFetch={dataChanged}
      />
    </div>
  );
}
