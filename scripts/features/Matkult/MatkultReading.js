import PropTypes from 'prop-types';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { getMatkultSourceUrl, getMatkultText } from './matkult';

export default function MatkultReading({ data }) {
  const headingId = useId();
  const text = getMatkultText(data);
  const url = getMatkultSourceUrl(data);
  const isRecipe = data.taxonomy?.some((item) => item.category?.toUpperCase() === 'MK-10');

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
      {text ? <p className="whitespace-pre-line text-base leading-relaxed">{text}</p> : <p>Lästext saknas för den här uppteckningen.</p>}
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
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-link underline">Läs med bilder och sammanhang på Matkult.se (nytt fönster)</a>}
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
