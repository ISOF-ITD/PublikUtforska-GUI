import { useEffect, useState } from 'react';
//import PropTypes from 'prop-types';
import config from '../../config';
import ImageMap from './ImageMap';
import { l } from '../../lang/Lang';

import ContributeInfoButton from './ContributeInfoButton';
import FeedbackButton from './FeedbackButton';
import TranscriptionHelpButton from './TranscriptionHelpButton';

import Uppteckningsblankett from './transcriptionForms/Uppteckningsblankett';
import Fritext from './transcriptionForms/Fritext';

import { getPlaceString } from '../../utils/helpers';
import TranscribeButton from './TranscribeButton';

// Main CSS: ui-components/overlay.less
// ImageMap CSS: ui-components/image-map.less

export default function TranscriptionPageByPageOverlay() {
	//TranscriptionPageByPageOverlay.propTypes = {
	//	title: PropTypes.string,
	//	type: PropTypes.string.isRequired,
	//  };
	
	  TranscriptionPageByPageOverlay.defaultProps = {
		//title: '',
	  };
	
/* 	const [state, setState] = useState({
		visible: false,
		informantNameInput: '',
		informantBirthDateInput: '',
		informantBirthPlaceInput: '',
		informantInformationInput: '',
		messageInput: '',
		messageCommentInput: '',
		nameInput: '',
		emailInput: '',
		messageSent: false,
		messageOnFailure: '',
		currentImage: null,
		transcriptionType: '',
		random: false,
		visible: false,
		// Session
		type: null,
		title: '',
		id: null,
		archiveId: null,
		url: null,
		images: null,
		transcriptionType: null,
		imageIndex: 0,
		placeString: null,
		sessionStateChanged: false,
	});
 */	// Session parameters
 	const [url, setUrl] = useState(null);
	const [id, setId] = useState(null);
	const [archiveId, setArchiveId] = useState(null);
	const [title, setTitle] = useState(null);
	const [images, setImages] = useState(null); // images is all pages to transcribe
	const [imageIndex, setImageIndex] = useState(null); // imageIndex is current page to transcribe
	const [placeString, setPlaceString] = useState(null);
	const [type, setType] = useState(null);

	// Transcribe parameters
	const [visible, setVisible] = useState(false);
	const [informantNameInput, setInformantNameInput] = useState('');
	const [informantBirthDateInput, setInformantBirthDateInput] = useState('');
	const [informantBirthPlaceInput, setInformantBirthPlaceInput] = useState('');
	const [informantInformationInput, setInformantInformationInput] = useState('');
	const [messageInput, setMessageInput] = useState('',);
	const [messageCommentInput, setMessageCommentInput] = useState('');
	const [nameInput, setNameInput] = useState('');
	const [emailInput, setMailInput] = useState('');
	// Probably if message should be/has been shown, like: Error, Show thank you message
	const [messageSent, setMessageSent] = useState(false);
	const [messageOnFailure, setMessageOnFailure] = useState('');
	const [currentImage, setCurrentImage] = useState(null);
	const [transcriptionType, setTranscriptionType] = useState('');
	const [transcribesession, setTranscribesession] = useState('');
	const [random, setRandom] = useState(false);
	const [readytotranscribe, setReadytotranscribe] = useState(false);

	useEffect(() => {
		// Lyssna på event när ljudspelare syns, lägger till .has-docked-control till body class
		//console.log('TranscriptionPageByPageOverlay window.eventBus');
		window.eventBus.addEventListener('overlay.transcribePageByPage', function(event) {
			if(event.target.random){
				fetch(`${config.apiUrl}random_document/?type=arkiv&recordtype=one_record&transcriptionstatus=readytotranscribe&mark_metadata=transcriptionstatus&categorytypes=tradark&publishstatus=published`)
				.then(function(response) {
					return response.json()
				})
				.then(function(json) {
					const randomDocument = json.hits.hits[0]._source;
					setVisible(true);
					// setType(event.target.type);
					setTitle(randomDocument.title);
					setId(randomDocument.id);
					setArchiveId(randomDocument.archive.archive_id);
					setUrl(config.siteUrl+'#/records/'+randomDocument.id);
					setImages(randomDocument.media);
					setTranscriptionType(randomDocument.transcriptiontype);
					setImageIndex(0);
					setPlaceString(getPlaceString(randomDocument.places));
					setRandom(event.target.random);
					transcribeStart(randomDocument.id);
				});
			} else {
				setVisible(true);
				setType(event.target.type);
				setTitle(event.target.title);
				setId(event.target.id);
				setArchiveId(event.target.archiveId || null);
				setUrl(event.target.url);
				setImages(event.target.images);
				setTranscriptionType(event.target.transcriptionType);
				setImageIndex(0);
				setPlaceString(event.target.placeString || null);
				setRandom(event.target.random);
				transcribeStart(event.target.id,event.target.images[0].source);
			}
		});
		window.eventBus.addEventListener('overlay.hide', function(event) {
			setVisible(false)
		});
	}, []); // Empty list: Only at mount

	// useEffect hook with state of id, imageIndex state as a dependency
	useEffect(() => {
		// This function will be called whenever state of id, imageIndex changes
		// console.log("state-array has been updated:", state);
		// When transcribe session state, id, imageIndex, is changed
		console.log("images)")
		console.log(images)
		if (images) {
			var images = images;
			var currentImage = images[imageIndex];
			var currentImageSource = currentImage.source;
			if (currentImage.transcriptionstatus === "readytotranscribe") {
				transcribeStart(id, currentImageSource);
			};
			if (currentImage.transcriptionstatus === "undertranscription") {
				console.log("currentImage")
				setMessageInput(currentImage.text);
			};
		}
	}, [id, imageIndex]); // state of id, imageIndex is specified as a dependency

	const transcribeStart = (recordid, imageSource) => {
		//if (page.transcriptionstatus === 'readytotranscribe') {
		var data = {
			recordid: recordid,
			page: imageSource,
		};

		var formData = new FormData();
		formData.append("json", JSON.stringify(data) );

		fetch(config.restApiUrl+'transcribestart/', {
			method: "POST",
			body: formData
		})
		.then(function(response) {
			return response.json()
		}).then(function(json) {
			var responseSuccess = false;
			if (json.success) {
				if (json.success == 'true') {
					var transcribesession = false;
					if (json.data) {
						transcribesession = json.data.transcribesession;
					};
					responseSuccess = true;
					// localStorage.setItem(`transcribesession ${recordid}`, transcribesession);
					// Do not show any message:
					setMessageSent(false);
					setTranscribesession(transcribesession);
					setReadytotranscribe(true);
				}
			}
			if (!responseSuccess) {
				setMessageSent(false);
				// Inactivate "Skicka in"-button
				setReadytotranscribe(false);
			}
		});
		// }
	};

	const transcribeCancel = (keepOverlayVisible = false) => {
		setVisible(keepOverlayVisible);
		// Clear transcribe fields:
		setInformantName('');
		setInformantBirthDate('');
		setInformantBirthPlace('');
		setInformantInformation('');
		setTitle('');
		setMessageComment('');
		setMessageOnFailure(json.message);

		if(!messageSent) {
			// localStorage.removeItem(`transcribesession ${id}`);
			
			var data = {
				recordid: id,
				transcribesession: transcribesession,
			};
			
			var formData = new FormData();
			formData.append("json", JSON.stringify(data) );
			
			fetch(config.restApiUrl+'transcribecancel/', {
				method: "POST",
				body: formData,
			})
		} else {
			return null;
		}
	};

	const closeButtonClickHandler = () =>  {
		transcribeCancel();
	};

	const randomButtonClickHandler = () =>  {
		transcribeCancel({ keepOverlayVisible: true });
		if(window.eventBus) {
			window.eventBus.dispatch('overlay.transcribe', {
				random: true,
			});
		}
	};

	const mediaImageClickHandler = () => {
		imageIndex: event.currentTarget.dataset.index
	};

	const inputChangeHandler = () =>  {
		setState({
			[event.target.name]: event.target.value
		});
	};

	const sendButtonClickHandler = () =>  {
		//console.log(this.state);
		let text = messageInput;
		let isMinimum2Words = text.trim().indexOf(' ') != -1;
		if (!isMinimum2Words) {
			alert(l('Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'));
		}
		else {
			var data = {
				transcribesession: transcribesession,
				url: url,
				recordid: id,
				recordtitle: title,
				from_email: emailInput,
				from_name: nameInput,
				subject: "Crowdsource: Transkribering",
				informantName: informantNameInput,
				informantBirthDate: informantBirthDateInput,
				informantBirthPlace: informantBirthPlaceInput,
				informantInformation: informantInformationInput,
				message: messageInput,
				messageComment: messageCommentInput,
			};	

			var formData = new FormData();
			formData.append("json", JSON.stringify(data) );

			fetch(config.restApiUrl+'transcribe/', {
				method: "POST",
				body: formData
			})
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				if (json.success) {
					// send signal to current view to re-mount
					if(window.eventBus) {
						window.eventBus.dispatch('overlay.transcribe.sent');
					}
					// Show thank you message:
					setMessageSent(true);
					// Clear transcribe fields:
					setInformantName('');
					setInformantNameInput('');
					setInformantBirthDate('');
					setInformantBirthDateInput('');
					setInformantBirthPlace('');
					setInformantBirthPlaceInput('');
					setInformantInformation('');
					setInformantInformationInput('');
					setTitle('');
					setMessageInput('');
					setMessageComment('');
					setMessageCommentInput('');
					setMessageOnFailure(json.message);
				} else {
						// Show message:
						console.log('Server does not repond for: ' + url);
				}
			});
		}
	};

	const renderTranscribeForm = () =>  {
		// write a switch-statement for the different transcription types
		// and return the correct form
		switch (transcriptionType) {
			case 'uppteckningsblankett':
				return (
					<Uppteckningsblankett 
						informantNameInput={informantNameInput}
						informantBirthDateInput={informantBirthDateInput}
						informantBirthPlaceInput={informantBirthPlaceInput}
						informantInformationInput={informantInformationInput}
						title={title}
						messageInput={messageInput}
						inputChangeHandler={inputChangeHandler} 
						/>
				);
			case 'fritext':
				return (
					<Fritext 
						messageInput={messageInput}
						inputChangeHandler={inputChangeHandler} 
					/>
				);
			default:
				return (
					<Fritext 
						messageInput={messageInput}
						inputChangeHandler={inputChangeHandler} 
					/>
				);
		}
	};
		
	// let _props = props;

	if (messageSent) {
		let message = 'Tack för din avskrift som nu skickats till Institutet för språk och folkminnen. Efter granskning kommer den att publiceras.'
		if (messageOnFailure) {
			message = messageOnFailure;
		}
		var overlayContent = <div>
			<p>{l(message)}</p>
			<p><br/>
			<TranscribeButton className='button button-primary' random={true} label={
				random ? l('Skriv av en till slumpmässig uppteckning') : l('Skriv av en slumpmässigt utvald uppteckning')
			} />
			&nbsp;
			<button className="button-primary" onClick={closeButtonClickHandler}>Stäng</button></p>
		</div>;
	}
	else {
		if (images && images.length > 0) {
			var imageItems = images.map(function(mediaItem, index) {
				if (mediaItem.source && mediaItem.source.indexOf('.pdf') == -1) {
					return <img data-index={index} key={index} className="image-item" data-image={mediaItem.source} onClick={mediaImageClickHandler} src={config.imageUrl+mediaItem.source} alt="" />;
				}
			}.bind(this));
		}

		var overlayContent = <div className="row">

			<div className="four columns">
				{/*
				<p><a href="https://www.isof.se/om-oss/kartor/sagenkartan/transkribera.html"><strong>{l('Läs mer om att skriva av.')}</strong></a><br/><br/></p>

				<hr/>

				*/}
				{renderTranscribeForm()}

				<label htmlFor="transcription_comment" className="u-full-width margin-bottom-zero">{l('Kommentar till avskriften:')}</label>
				<textarea lang="sv" spellCheck="false" id="transcription_comment" name="messageCommentInput" className="u-full-width margin-bottom-minimal" type="text" value={messageCommentInput} onChange={inputChangeHandler} />
				<p>{l('Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte.')}
				<br/>{l('Vi hanterar personuppgifter enligt dataskyddsförordningen. ')}<a href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html" target={"_blank"}><strong>{l('Läs mer.')}</strong></a></p>

				<label htmlFor="transcription_name">Ditt namn (frivilligt):</label>
				<input id="transcription_name" autoComplete="name" name="nameInput" className="u-full-width" type="text" value={nameInput} onChange={inputChangeHandler} />
				<label htmlFor="transcription_email">Din e-post adress (frivilligt):</label>
				<input id="transcription_email" autoComplete="" name="emailInput" className="u-full-width" type="email" value={emailInput} onChange={inputChangeHandler} />

				{readytotranscribe && <button className="button-primary" onClick={sendButtonClickHandler}>Skicka</button> }
			</div>

			<div className="eight columns">

				<ImageMap image={images ? config.imageUrl+images[imageIndex].source : null} />

				<div className="image-list">
					{imageItems}
				</div>
			</div>

		</div>;
	}

return (<div className={'overlay-container'+(visible ? ' visible' : '')}>
	<div className="overlay-window large">

		<div className="overlay-header">
			{l('Skriv av')} {title ? `"${title}"` : 'uppteckning'}
			{ archiveId &&
				<small>&nbsp;(ur {archiveId}{placeString ? ` ${placeString}` : ''})</small>
				
			}
			{/* om detta är en slumpmässig uppteckning, visa en knapp som heter "skriv av annan slumpmässig uppteckning" */}
			{ random && !messageSent &&
				<div className={'next-random-record-button-container'}>
					<TranscribeButton
						label={l('Skriv av annan slumpmässig uppteckning')}
						random={true}
						onClick={randomButtonClickHandler}
						className="button button-primary next-random-record-button"
					/>
				</div>
			}
			<button title="stäng" className="close-button white" onClick={closeButtonClickHandler}></button>
			{
				!config.siteOptions.hideContactButton &&
				<FeedbackButton title={title} type="Uppteckning" />
			}
			{
				!config.siteOptions.hideContactButton &&
				<ContributeInfoButton title={title} type="Uppteckning" />
			}
			{
				!config.siteOptions.hideContactButton &&
				<TranscriptionHelpButton title={title} type="Uppteckning" />
				// <TranscriptionHelpButton title={title} type="Uppteckning" {..._props}/>
			}
		</div>

		{overlayContent}

	</div>
	</div>
	);
};
