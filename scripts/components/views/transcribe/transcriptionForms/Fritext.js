/* eslint-disable react/require-default-props */
import React from 'react';

import PropTypes from 'prop-types';

export default function Fritext({
  messageInput = '',
  inputChangeHandler,
  pageIndex = null,
  transcriptionstatus = null,
  numberOfPages = null,
}) {
  return (
    <div className="transcriptionform fritext">
      <div className="mark-above-img">
        <label htmlFor="transcription_text" className="u-full-width margin-bottom-zero">
          Text
          {pageIndex !== undefined && pageIndex !== null ? ` på sidan ${pageIndex + 1} (av ${numberOfPages})` : ''}
          :
        </label>
        <textarea
          // disable if transcriptionstatus is not published or null
          disabled={transcriptionstatus !== 'readytotranscribe' && transcriptionstatus !== null}
          lang="sv"
          spellCheck="false"
          id="transcription_text"
          name="messageInput"
          className="u-full-width margin-bottom-minimal"
          value={messageInput}
          onChange={inputChangeHandler}
        />
        {//
                    //	<figure>
                    //    <img src="img/ifgh-card-upperpart-text.png" width="400" height="100" alt="photo"></img>
                    // </figure>
                    //
                }
      </div>
    </div>
  );
}

Fritext.propTypes = {
  messageInput: PropTypes.string.isRequired,
  inputChangeHandler: PropTypes.func.isRequired,
  pageIndex: PropTypes.number,
  transcriptionstatus: PropTypes.string,
  numberOfPages: PropTypes.number,
};
