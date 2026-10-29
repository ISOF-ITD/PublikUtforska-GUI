import PropTypes from 'prop-types';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { getMatkultSourceUrl, getMatkultText } from './matkult';
import useMatkultArticle from './useMatkultArticle';

export default function MatkultReading({ data }) {
  const headingId = useId();
  const text = getMatkultText(data);
  const url = getMatkultSourceUrl(data);
  const article = useMatkultArticle(url);
  const isRecipe = data.taxonomy?.some((item) => item.category?.toUpperCase() === 'MK-10');
  const fallbackContent = text
    ? <p className="whitespace-pre-line text-base leading-relaxed">{text}</p>
    : <p>Lästext saknas för den här uppteckningen.</p>;

  return (
    <section aria-labelledby={headingId} className="my-6 max-w-3xl rounded-lg border border-border bg-surface-muted p-5 text-body md:p-8">
      <p className="!mt-0 text-sm text-muted">
        <Link to="/matkult" className="text-link underline">Matkult</Link>
        {' '}
        ·
        {' '}
        {isRecipe ? 'Ur kokboken' : 'Berättelser om matkultur'}
      </p>
      <h2 id={headingId} className="!mt-0 !text-2xl">{isRecipe ? 'Receptets lästext' : 'Lästext'}</h2>
      {article.status === 'loading' && <p role="status" className="text-sm text-muted">Hämtar formaterad presentation från Matkult.se…</p>}
      {article.status === 'error' && (
        <div role="status" className="mb-4 rounded border border-border bg-surface p-4 text-sm">
          <p className="!mt-0">
            Den formaterade presentationen kunde inte hämtas.
            {' '}
            {text ? 'Här visas tillgänglig lästext.' : 'Du kan läsa innehållet på Matkult.se.'}
          </p>
          <button type="button" onClick={article.retry} className="!m-0 !h-auto rounded border border-border bg-surface px-3 py-2 text-link focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus">Försök igen</button>
        </div>
      )}
      {article.status === 'ready' ? (
        <div
          className="text-base leading-relaxed [&_p]:my-4 [&_p]:max-w-[65ch] [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-2 [&_figure]:mx-0 [&_figure]:my-6 [&_img]:mx-auto [&_img]:h-auto [&_img]:max-h-[75vh] [&_img]:max-w-full [&_img]:object-contain [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-muted [&_a]:text-link [&_a]:underline [&_a]:underline-offset-2 [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-focus [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      ) : fallbackContent}
      <dl className="my-5 grid gap-2 text-sm">
        {data.archive?.archive_id && (
        <div>
          <dt className="inline font-semibold">Arkivreferens: </dt>
          <dd className="inline !ml-0">{data.archive.archive_id}</dd>
        </div>
        )}
        {data.archive?.archive && (
        <div>
          <dt className="inline font-semibold">Arkiv: </dt>
          <dd className="inline !ml-0">{data.archive.archive}</dd>
        </div>
        )}
      </dl>
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-link underline">{article.status === 'ready' ? 'Text och bilder från Matkult.se – öppna originalsidan (nytt fönster)' : 'Läs med bilder och sammanhang på Matkult.se (nytt fönster)'}</a>}
    </section>
  );
}

MatkultReading.propTypes = {
  data: PropTypes.shape({
    metadata: PropTypes.arrayOf(PropTypes.object),
    taxonomy: PropTypes.arrayOf(PropTypes.object),
    archive: PropTypes.object,
    text: PropTypes.string,
    contents: PropTypes.string,
  }).isRequired,
};
