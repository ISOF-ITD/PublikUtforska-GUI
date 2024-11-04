import React from 'react';
import PropTypes from 'prop-types';
import { l } from '../../../lang/Lang';

function CommentsElement({ data }) {
  const {
    comment,
  } = data;
  if (!comment) return null;

  return (
    <div className="text-small">
      <strong>{`${l('Kommentarer')}:`}</strong>
      <p
        className="display-line-breaks"
        dangerouslySetInnerHTML={{ __html: comment.split(';').join('<br/>') }}
      />
    </div>
  );
}

export default CommentsElement;

CommentsElement.propTypes = {
  data: PropTypes.object.isRequired,
};
