import React from 'react';
import PropTypes from 'prop-types';

export default function Uppteckningsblankett({
  informantNameInput,
  informantBirthDateInput,
  informantBirthPlaceInput,
  informantInformationInput,
  title,
  messageInput,
  inputChangeHandler,
  pageIndex,
  numberOfPages,
}) {
    Uppteckningsblankett.propTypes = {
        informantNameInput: PropTypes.string,
        informantBirthDateInput: PropTypes.string,
        informantBirthPlaceInput: PropTypes.string,
        informantInformationInput: PropTypes.string,
        title: PropTypes.string,
        messageInput: PropTypes.string,
        inputChangeHandler: PropTypes.func.isRequired,
        pageIndex: PropTypes.number,
        numberOfPages: PropTypes.number,
      };
      
      Uppteckningsblankett.defaultProps = {
        informantNameInput: '',
        informantBirthDateInput: '',
        informantBirthPlaceInput: '',
        informantInformationInput: '',
        title: '',
        messageInput: '',
        pageIndex: null,
        numberOfPages: null,
      };
      
  return (
    <div className="transcriptionform uppteckningsblankett">
      <div className="row">
        <label htmlFor="transcription_informantname" className="six columns">Berättat av:</label>
        <label htmlFor="transcription_informantbirthdate" className="two columns">Född år:</label>
        <label htmlFor="transcription_informantbirthplace" className="four columns">Född i:</label>
      </div>

      <div className="row">
        <div className="mark-below-img">
          <input id="transcription_informantname" name="informantNameInput" className="six columns" type="text" value={informantNameInput} onChange={inputChangeHandler} />
        </div>

        <div className="mark-below-img">
          <input id="transcription_informantbirthdate" name="informantBirthDateInput" className="two columns" type="text" value={informantBirthDateInput} onChange={inputChangeHandler} />
        </div>

        <div className="mark-below-img">
          <input id="transcription_informantbirthplace" name="informantBirthPlaceInput" className="four columns" type="text" value={informantBirthPlaceInput} onChange={inputChangeHandler} />
        </div>
      </div>

      <label htmlFor="transcription_informant" className="u-full-width margin-bottom-zero">Fält under berättat av:</label>
      <input id="transcription_informant" name="informantInformationInput" className="u-full-width margin-bottom-minimal" type="text" value={informantInformationInput} onChange={inputChangeHandler} />

      <div className="mark-above-img">
        <label htmlFor="transcription_title" className="u-full-width margin-bottom-zero">Titel:</label>
        <input id="transcription_title" name="title" className="u-full-width margin-bottom-minimal" type="text" value={title} onChange={inputChangeHandler} />
      </div>

      <div className="mark-above-img">
        <label htmlFor="transcription_text" className="u-full-width margin-bottom-zero">
          Text
          {pageIndex !== undefined && pageIndex !== null ? ` på sidan ${pageIndex + 1} (av ${numberOfPages})` : ''}
          :
        </label>
        <textarea lang="sv" spellCheck="false" id="transcription_text" name="messageInput" className="u-full-width margin-bottom-minimal" value={messageInput} onChange={inputChangeHandler} />
      </div>
    </div>
  );
}
