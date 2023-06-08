import React from 'react';

import PropTypes from 'prop-types';

export default function Fritext({ messageInput, inputChangeHandler }) {
  Fritext.propTypes = {
    messageInput: PropTypes.string.isRequired,
    inputChangeHandler: PropTypes.func.isRequired,
  };

  return (
    <div className="transcriptionform fritext">
      <div className="mark-above-img">
        <label htmlFor="transcription_text" className="u-full-width margin-bottom-zero">Text:</label>
        <textarea
          lang="sv"
          spellCheck="false"
          id="transcription_text"
          name="messageInput"
          className="u-full-width margin-bottom-minimal"
          defaultValue={messageInput}
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

