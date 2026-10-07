/* eslint-disable react/require-default-props */
import propTypes from 'prop-types';
import { useId } from 'react';
import { l } from '../../../lang/Lang';
import { getTitleText } from '../../../utils/helpers';
import ContactButtonGroup from '../../../components/views/ContactButtonGroup';
import BookmarkedRecordButton from '../../../components/BookmarkedRecordButton';

export default function RecordViewHeader({ data, headingId }) {
  const generatedHeadingId = useId();
  const titleText = getTitleText(data);

  return (
    <div className="container-header">
      <div className="row">
        <div className="eleven columns">
          <h1 id={headingId || generatedHeadingId} className="break-words max-[650px]:!text-xl max-[650px]:!leading-snug">
            {titleText && titleText !== '[]' ? titleText : l('(Utan titel)')}
          </h1>
        </div>
      </div>
      <ContactButtonGroup className="!static mt-2 w-full flex-wrap justify-end gap-2">
        <BookmarkedRecordButton record={data} variant="contact" />
      </ContactButtonGroup>
    </div>
  );
}

RecordViewHeader.propTypes = {
  headingId: propTypes.string,
  data: propTypes.shape({
    title: propTypes.string,
    recordtype: propTypes.string.isRequired,
    materialtype: propTypes.string,
    archive: propTypes.shape({
      archive_id: propTypes.string.isRequired,
      archive_org: propTypes.string.isRequired,
      archive_id_row: propTypes.string.isRequired,
      archive_id_display_search: propTypes.arrayOf(propTypes.string),
    }).isRequired,
    country: propTypes.string,
    id: propTypes.string.isRequired,
    year: propTypes.string,
    places: propTypes.arrayOf(propTypes.shape({
      id: propTypes.string.isRequired,
      name: propTypes.string.isRequired,
      specification: propTypes.string,
      harad: propTypes.string,
      fylke: propTypes.string,
      landskap: propTypes.string,
    })),
    persons: propTypes.arrayOf(propTypes.shape({
      id: propTypes.string,
      name: propTypes.string.isRequired,
      relation: propTypes.string,
    })),
  }).isRequired,
  // subrecordsCount: propTypes.object,
};
