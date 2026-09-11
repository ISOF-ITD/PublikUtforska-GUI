export const RESULT_CARD_BASE_CLASS = [
  'group relative overflow-hidden rounded-md !border',
  'bg-[var(--color-result-card-bg)] p-3 shadow-sm transition-all hover:shadow-md',
].join(' ');
export const RESULT_CARD_CLASS = [
  RESULT_CARD_BASE_CLASS,
  '!border-[var(--color-result-card-rule)]',
].join(' ');

export const RESULT_CARD_TITLE_CLASS = 'block text-lg font-semibold leading-tight !text-link';
export const RESULT_CARD_LINK_CLASS = [
  '!text-link hover:underline focus:outline-none',
  'focus-visible:ring-2 focus-visible:ring-focus',
].join(' ');
export const RESULT_CARD_METADATA_CLASS = 'mt-3 flex flex-col text-sm leading-snug';
export const RESULT_CARD_METADATA_ROW_CLASS = [
  'grid grid-cols-[5.75rem_minmax(0,1fr)]',
  'border-t border-[var(--color-result-card-rule)] py-1',
].join(' ');
export const RESULT_CARD_LABEL_CLASS = [
  'pr-2 text-right text-[var(--color-result-card-label)]',
].join(' ');
export const RESULT_CARD_VALUE_CLASS = 'min-w-0 break-words font-medium text-body';
export const RESULT_CARD_VALUE_ADDITIONAL_CLASS = 'min-w-0 break-words text-muted';
export const RESULT_CARD_GRID_CLASS = [
  'grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-4',
].join(' ');

export const RESULT_TABLE_CLASS = 'mobile-table w-full text-sm border-collapse';
export const RESULT_TABLE_HEADER_ROW_CLASS = 'border-b border-border last:border-0';
export const RESULT_TABLE_ROW_CLASS = [
  'border-b border-border last:border-0 even:bg-surface odd:bg-surface-muted',
].join(' ');

export const RESULT_TOOLBAR_BUTTON_CLASS = [
  'inline-flex min-h-8 items-center justify-center gap-2 rounded border',
  'border-border bg-surface px-3 py-1 leading-normal text-body',
  'hover:bg-surface-hover focus-visible:outline focus-visible:outline-2',
  'focus-visible:outline-offset-2 focus-visible:outline-focus',
].join(' ');
export const RESULT_TOOLBAR_CLASS = [
  'mb-3 flex flex-wrap items-end gap-3',
].join(' ');
export const RESULT_VIEW_CONTROLS_CLASS = [
  'flex flex-wrap items-center justify-start gap-3',
].join(' ');
