import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRecordFetchLocation } from '../../utils/helpers';
import { createDetailLocation } from '../../utils/routeHelper';
import {
  MATKULT_CATEGORIES, createMatkultSearch, getDailyRecipeId, matkultDetailSearch,
} from './matkult';
import categoryImages from './categoryImages';

const FEATURED_IDS = ['mk34715', 'matkarta26629', 'mk-kb888'];
const buttonClass = 'inline-flex min-h-11 items-center justify-center rounded bg-primary px-4 py-2 !text-white no-underline hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2';

async function fetchPublishedRecord(id, signal) {
  const response = await fetch(getRecordFetchLocation(id), { signal });
  if (!response.ok) throw new Error('Kunde inte hämta materialet.');
  const json = await response.json();
  const { _source: record } = json;
  if (!json.found || record?.publishstatus !== 'published') {
    throw new Error('Materialet är inte tillgängligt.');
  }
  return record;
}

function detailLink(id) {
  return createDetailLocation({ resource: 'records', id, search: matkultDetailSearch() });
}

export default function MatkultPage() {
  const navigate = useNavigate();
  const [recipeId] = useState(getDailyRecipeId);
  const [recipe, setRecipe] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    document.title = 'Matkult – Folke';
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    setError(false);
    setRecipe(null);
    fetchPublishedRecord(recipeId, signal).then((data) => {
      if (!signal.aborted) setRecipe(data);
    }).catch(() => {
      if (!signal.aborted) setError(true);
    }).finally(() => {
      if (!signal.aborted) setLoading(false);
    });
    Promise.allSettled(FEATURED_IDS.map((id) => fetchPublishedRecord(id, signal)))
      .then((results) => {
        if (!signal.aborted) {
          setFeatured(results.filter((result) => result.status === 'fulfilled').map((result) => result.value));
        }
      });
    return () => controller.abort();
  }, [attempt, recipeId]);

  const categories = showAllCategories
    ? MATKULT_CATEGORIES.filter((item) => item.id !== 'MK-10')
    : ['MK-3', 'MK-1', 'MK-12'].map((id) => MATKULT_CATEGORIES.find((item) => item.id === id));

  return (
    <div className="mx-auto w-full max-w-6xl py-8 text-body">
      <div className="grid items-stretch gap-8 md:grid-cols-2">
        <section className="flex flex-col items-start justify-center gap-5">
          <p className="!m-0 text-sm font-semibold uppercase tracking-widest text-muted">Ett tema i Folke</p>
          <h1 className="!m-0 !text-4xl !leading-tight md:!text-5xl">
            Matkult.
            <br />
            Traditionell matkultur i Sverige.
          </h1>
          <p className="!m-0 max-w-lg text-lg leading-relaxed">Recept, råvaror och berättelser ur arkiven. Upptäck människorna och platserna bakom vår matkultur.</p>
          <div className="flex flex-wrap gap-4">
            <Link className={buttonClass} to={createMatkultSearch({ category: 'MK-10' })}>Öppna kokboken</Link>
            <Link className="self-center text-link underline" to={createMatkultSearch()}>Utforska allt i Matkult</Link>
          </div>
        </section>
        <section aria-labelledby="matkult-daily-heading" className="rounded-lg border-l-4 border-[var(--color-matkult-accent)] bg-[var(--color-matkult-bg)] p-6 text-[var(--color-matkult-text)] md:p-8">
          <h2 id="matkult-daily-heading" className="!mt-0 !text-sm font-semibold uppercase tracking-widest text-muted">Dagens recept</h2>
          {loading && <p role="status">Hämtar dagens recept…</p>}
          {error && (
            <div role="alert">
              <p>Det gick inte att hämta dagens recept.</p>
              <button type="button" className="button button-secondary" onClick={() => setAttempt((value) => value + 1)}>Försök igen</button>
              <p><Link to={createMatkultSearch({ category: 'MK-10' })} className="text-link underline">Utforska kokboken</Link></p>
            </div>
          )}
          {recipe && (
            <>
              <h3 className="!text-3xl !leading-snug">{recipe.title}</h3>
              <p className="text-muted">
                {recipe.places?.map((place) => [place.name, place.landskap].filter(Boolean).join(', ')).join(' · ')}
                {recipe.year ? ` · ${recipe.year.slice(0, 4)}` : ''}
              </p>
              <Link className={buttonClass} to={detailLink(recipe.id)}>Läs receptet</Link>
            </>
          )}
        </section>
      </div>

      <form
        className="my-8 rounded-lg bg-surface-muted p-4"
        onSubmit={(event) => {
          event.preventDefault();
          navigate(createMatkultSearch({ search: query.trim() || undefined }));
        }}
      >
        <input type="hidden" name="theme" value="matkult" />
        <input type="hidden" name="view" value="cards" />
        <div className="flex flex-wrap gap-2">
          <label htmlFor="matkult-query" className="!m-0 min-w-0 flex-[1_1_16rem] font-semibold">
            <span className="mb-2 block">Sök i Matkult</span>
            <input id="matkult-query" type="search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök på ett recept, en råvara eller en plats" className="!m-0 w-full min-w-0 rounded border border-border bg-surface px-3 py-2 text-base font-normal text-body" />
          </label>
          <button type="submit" className={`${buttonClass} !m-0 self-end`}>Sök</button>
        </div>
      </form>

      <section aria-labelledby="matkult-categories-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="matkult-categories-heading" className="!m-0">Kategorier</h2>
          <button type="button" className="!m-0 !h-auto border-0 bg-transparent !p-2 text-link underline" aria-expanded={showAllCategories} aria-controls="matkult-categories" onClick={() => setShowAllCategories((value) => !value)}>{showAllCategories ? 'Visa färre kategorier' : 'Alla kategorier'}</button>
        </div>
        <ul id="matkult-categories" className="!m-0 grid !list-none gap-4 !p-0 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((item) => (
            <li key={item.id} className="!m-0">
              <Link to={createMatkultSearch({ category: item.id })} className="block overflow-hidden rounded-lg border border-border bg-surface text-link no-underline hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2">
                <img src={categoryImages[item.id]} alt="" loading="lazy" className="h-32 w-full object-cover" />
                <span className="block p-4 text-lg font-semibold">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="matkult-featured-heading" className="mt-8">
          <h2 id="matkult-featured-heading">Recept och berättelser</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((record) => (
              <article key={record.id} className="rounded-lg border border-border bg-surface p-5">
                <p className="!mt-0 text-sm text-muted">{record.taxonomy?.some((item) => item.category === 'MK-10') ? 'Ur kokboken' : 'Berättelser om matkultur'}</p>
                <h3 className="!text-xl"><Link to={detailLink(record.id)} className="text-link underline">{record.title}</Link></h3>
                <p className="text-sm text-muted">
                  {record.places?.[0]?.name}
                  {record.year ? ` · ${record.year.slice(0, 4)}` : ''}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
