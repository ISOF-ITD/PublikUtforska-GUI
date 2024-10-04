import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import PdfGif from '../../../img/pdf.gif';

export default function Filter({
  uniqueId, filter, onChange, openHelp,
}) {
  return (
    <div className="filter-wrapper">
      <label htmlFor={`all-filter-${uniqueId}`}>
        <input
          type="radio"
          name={`filter-${uniqueId}`}
          value=""
          checked={filter === ''}
          onChange={onChange}
          id={`all-filter-${uniqueId}`}
        />
        Allt
      </label>
      <label htmlFor={`one-accession-row-filter-${uniqueId}`}>
        <input
          type="radio"
          name={`filter-${uniqueId}`}
          value="one_accession_row"
          checked={filter === 'one_accession_row'}
          onChange={onChange}
          id={`one-accession-row-filter-${uniqueId}`}
        />
        <sub>
          <img src={PdfGif} style={{ marginRight: 5 }} alt="pdf" title="Accession" />
        </sub>
        Accessioner
      </label>
      <label htmlFor={`one-record-filter-${uniqueId}`}>
        <input
          type="radio"
          name={`filter-${uniqueId}`}
          value="one_record"
          checked={filter === 'one_record'}
          onChange={onChange}
          id={`one-record-filter-${uniqueId}`}
        />
        <FontAwesomeIcon icon={faFileLines} style={{ marginRight: 5 }} alt="jpg" title="Uppteckning" />
        Uppteckningar
      </label>
      <span className="switcher-help-button" onClick={openHelp} title="Om accessioner och uppteckningar">
        ?
      </span>
    </div>
  );
}

Filter.propTypes = {
  uniqueId: PropTypes.string.isRequired,
  filter: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  openHelp: PropTypes.func.isRequired,
};