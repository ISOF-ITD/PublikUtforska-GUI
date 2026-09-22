import { faGrip, faTable } from '@fortawesome/free-solid-svg-icons';

export const VIEW_OPTIONS = [
  {
    value: 'table',
    label: 'Tabell',
    icon: faTable,
  },
  {
    value: 'cards',
    label: 'Kort',
    icon: faGrip,
  },
];

export const SORT_OPTIONS = [
  {
    field: '_score',
    order: 'desc',
    label: 'Relevans',
  },
  {
    field: 'archive.archive_id_row.keyword',
    order: 'asc',
    label: 'Accessionsnummer, stigande',
  },
  {
    field: 'archive.archive_id_row.keyword',
    order: 'desc',
    label: 'Accessionsnummer, fallande',
  },
  {
    field: 'year',
    order: 'asc',
    label: 'År, äldst först',
  },
  {
    field: 'year',
    order: 'desc',
    label: 'År, nyast först',
  },
];
