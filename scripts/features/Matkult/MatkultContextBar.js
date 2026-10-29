import { useId } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { parseResultSearch } from '../../utils/routeHelper';
import {
  MATKULT_CATEGORIES, MATKULT_RECIPE_CATEGORIES, createMatkultSearch, createWholeFolkeSearch,
} from './matkult';

export default function MatkultContextBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectId = useId();
  const params = parseResultSearch(location.search);
  const selectedCategories = (params.category || '').toUpperCase().split(',');
  const isCookbook = selectedCategories.includes('MK-10');
  const category = isCookbook ? 'MK-10'
    : MATKULT_CATEGORIES.find((item) => selectedCategories.includes(item.id))?.id || '';
  const recipeCategory = MATKULT_RECIPE_CATEGORIES
    .find((item) => selectedCategories.includes(item.id))?.id || '';
  const cookbookCategory = ['MK-10', recipeCategory].filter(Boolean).join(',');
  const mapSearch = new URLSearchParams(location.search);
  mapSearch.set('showmap', '1');

  return (
    <nav aria-label="Matkult" className="border-b border-border bg-surface px-4 py-3 text-body md:px-8">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link to="/matkult" className="font-semibold text-link underline underline-offset-4">Matkult</Link>
        <span className="text-sm text-muted">Matkartans material i Folke</span>
        <Link to={createMatkultSearch({ category: cookbookCategory }, location.search)} className="text-sm text-link underline">Kokboken</Link>
        <Link to={createMatkultSearch({}, mapSearch.toString())} className="text-sm text-link underline">Kartan</Link>
        <Link to={createWholeFolkeSearch(location.search)} className="ml-auto text-sm text-link underline">Sök i hela Folke</Link>
      </div>
      {location.pathname !== '/matkult' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor={selectId} className="!m-0 flex flex-wrap items-center gap-2 text-sm">
            Utforska kategori
            <select
              id={selectId}
              value={category}
              onChange={(event) => navigate(createMatkultSearch({
                category: event.target.value === 'MK-10' ? cookbookCategory
                  : event.target.value || undefined,
              }, location.search))}
              className="!m-0 max-w-full rounded border border-border bg-surface px-3 py-2 text-sm text-body"
            >
              <option value="">Allt i Matkult</option>
              {MATKULT_CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          {isCookbook && (
            <label htmlFor={`${selectId}-recipe`} className="!m-0 flex flex-wrap items-center gap-2 text-sm">
              Receptkategori
              <select
                id={`${selectId}-recipe`}
                value={recipeCategory}
                onChange={(event) => navigate(createMatkultSearch({
                  category: ['MK-10', event.target.value].filter(Boolean).join(','),
                }, location.search))}
                className="!m-0 max-w-full rounded border border-border bg-surface px-3 py-2 text-sm text-body"
              >
                <option value="">Alla recept</option>
                {MATKULT_RECIPE_CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </nav>
  );
}
