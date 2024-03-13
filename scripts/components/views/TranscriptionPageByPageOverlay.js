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
	
	const [state, setState] = useState({
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
	});
	// Session parameters
/* 	const [url, setUrl] = useState(null);
	const [id, setId] = useState(null);
	const [archiveId, setArchiveId] = useState(null);
	const [title, setTitle] = useState(null);
	const [images, setImages] = useState(null);
	const [imageIndex, setImageIndex] = useState(null);
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
	const [messageSent, setMessageSent] = useState(false);
	const [messageOnFailure, setMessageOnFailure] = useState('');
	const [currentImage, setCurrentImage] = useState(null);
	const [transcriptionType, setTranscriptionType] = useState('');
	const [random, setRandom] = useState(false);
 				setVisible(true);
				setType(event.target.type);
				setTitle(event.target.title);
				setId(event.target.id);
				seetArchiveId(event.target.archiveId || null);
				setUrl(event.target.url);
				stImages(event.target.images);
				setTranscriptionType(event.target.transcriptionType);
				setImageIndex(0);
				setPlaceString(event.target.placeString || null);
				setRandom(event.target.random);
 */	

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
					this.setState({
						visible: true,
						url: config.siteUrl+'#/records/'+randomDocument.id,
						id: randomDocument.id,
						archiveId: randomDocument.archive.archive_id,
						title: randomDocument.title,
						images: randomDocument.media,
						transcriptionType: randomDocument.transcriptiontype,
						imageIndex: 0,
						placeString: getPlaceString(randomDocument.places),
						random: true,
					});
					transcribeStart(randomDocument.id);
				});
			} else {
				setState({
					visible: true,
					// Session
					type: event.target.type,
					title: event.target.title,
					id: event.target.id,
					archiveId: event.target.archiveId || null,
					url: event.target.url,
					images: event.target.images,
					transcriptionType: event.target.transcriptionType,
					imageIndex: 0,
					placeString: event.target.placeString || null,
					random: event.target.random,
				});
				var images = state.images;
				var currentImage = images[state.imageIndex];
				var currentImageSource = currentImage.source;
				if (currentImage.transcriptionstatus === "readytotranscribe") {
					transcribeStart(event.target.id, currentImageSource);
				}
			}
		});
		window.eventBus.addEventListener('overlay.hide', function(event) {
			setState({
				visible: false
			});
		});
	});
	
	const transcribeStart = (recordid, page) => {
		var data = {
			recordid: state.recordid,
			page: state.page,
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
					setState({
						// Do not show any message:
						messageSent: false,
						transcribesession: transcribesession
					})
				}
			}
			if (!responseSuccess) {
				var messageOnFailure = 'Failure!';
				if (json.message) {
					messageOnFailure = json.message;
				}
				setState({
					// show message:
					messageSent: true,
					messageOnFailure: messageOnFailure
				})
			}
		});
	};

	const transcribeCancel = (keepOverlayVisible = false) => {
		setState({
			visible: keepOverlayVisible,
			informantName: '',
			informantBirthDate: '',
			informantBirthPlace: '',
			informantInformation: '',
			title: '',
			messageInput: '',
			messageComment: '',
			messageOnFailure: '',
		});

		if(!state.messageSent) {
			// localStorage.removeItem(`transcribesession ${state.id}`);
			
			var data = {
				recordid: state.id,
				transcribesession: state.transcribesession,
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
		setState({
			imageIndex: event.currentTarget.dataset.index
		});
	};

	const inputChangeHandler = () =>  {
		setState({
			[event.target.name]: event.target.value
		});
	};

	const sendButtonClickHandler = () =>  {
		//console.log(this.state);
		let text = state.messageInput;
		let isMinimum2Words = text.trim().indexOf(' ') != -1;
		if (!isMinimum2Words) {
			alert(l('Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'));
		}
		else {
			var data = {
				transcribesession: state.transcribesession,
				url: state.url,
				recordid: state.id,
				recordtitle: state.title,
				from_email: state.emailInput,
				from_name: state.nameInput,
				subject: "Crowdsource: Transkribering",
				informantName: state.informantNameInput,
				informantBirthDate: state.informantBirthDateInput,
				informantBirthPlace: state.informantBirthPlaceInput,
				informantInformation: state.informantInformationInput,
				message: state.messageInput,
				messageComment: state.messageCommentInput,
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
					setState({
						// Show thank you message:
						messageSent: true,
						// Clear transcribe fields:
						informantName: '',
						informantNameInput: '',
						informantBirthDate: '',
						informantBirthDateInput: '',
						informantBirthPlace: '',
						informantBirthPlaceInput: '',
						informantInformation: '',
						informantInformationInput: '',
						title: '',
						messageInput: '',
						messageComment: '',
						messageCommentInput: '',
						messageOnFailure: json.message,
					})
				} else {
						// Show message:
						console.log('Server does not repond for: ' + state.url);
				}
			});
		}
	};

	const renderTranscribeForm = () =>  {
		// write a switch-statement for the different transcription types
		// and return the correct form
		switch (state.transcriptionType) {
			case 'uppteckningsblankett':
				return (
					<Uppteckningsblankett 
						informantNameInput={state.informantNameInput}
						informantBirthDateInput={state.informantBirthDateInput}
						informantBirthPlaceInput={state.informantBirthPlaceInput}
						informantInformationInput={state.informantInformationInput}
						title={state.title}
						messageInput={state.messageInput}
						inputChangeHandler={inputChangeHandler} 
						/>
				);
			case 'fritext':
				return (
					<Fritext 
						messageInput={state.messageInput}
						inputChangeHandler={inputChangeHandler} 
					/>
				);
			default:
				return (
					<Fritext 
						messageInput={state.messageInput}
						inputChangeHandler={inputChangeHandler} 
					/>
				);
		}
	};
		
	// let _props = props;

	if (state.messageSent) {
		let message = 'Tack för din avskrift som nu skickats till Institutet för språk och folkminnen. Efter granskning kommer den att publiceras.'
		if (state.messageOnFailure) {
			message = state.messageOnFailure;
		}
		var overlayContent = <div>
			<p>{l(message)}</p>
			<p><br/>
			<TranscribeButton className='button button-primary' random={true} label={
				state.random ? l('Skriv av en till slumpmässig uppteckning') : l('Skriv av en slumpmässigt utvald uppteckning')
			} />
			&nbsp;
			<button className="button-primary" onClick={closeButtonClickHandler}>Stäng</button></p>
		</div>;
	}
	else {
		if (state.images && state.images.length > 0) {
			var imageItems = state.images.map(function(mediaItem, index) {
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
				<textarea lang="sv" spellCheck="false" id="transcription_comment" name="messageCommentInput" className="u-full-width margin-bottom-minimal" type="text" value={state.messageCommentInput} onChange={inputChangeHandler} />
				<p>{l('Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte.')}
				<br/>{l('Vi hanterar personuppgifter enligt dataskyddsförordningen. ')}<a href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html" target={"_blank"}><strong>{l('Läs mer.')}</strong></a></p>

				<label htmlFor="transcription_name">Ditt namn (frivilligt):</label>
				<input id="transcription_name" autoComplete="name" name="nameInput" className="u-full-width" type="text" value={state.nameInput} onChange={inputChangeHandler} />
				<label htmlFor="transcription_email">Din e-post adress (frivilligt):</label>
				<input id="transcription_email" autoComplete="" name="emailInput" className="u-full-width" type="email" value={state.emailInput} onChange={inputChangeHandler} />

				<button className="button-primary" onClick={sendButtonClickHandler}>Skicka</button>
			</div>

			<div className="eight columns">

				<ImageMap image={state.images ? config.imageUrl+state.images[state.imageIndex].source : null} />

				<div className="image-list">
					{imageItems}
				</div>
			</div>

		</div>;
	}

return (<div className={'overlay-container'+(state.visible ? ' visible' : '')}>
	<div className="overlay-window large">

		<div className="overlay-header">
			{l('Skriv av')} {state.title ? `"${state.title}"` : 'uppteckning'}
			{ state.archiveId &&
				<small>&nbsp;(ur {state.archiveId}{state.placeString ? ` ${state.placeString}` : ''})</small>
				
			}
			{/* om detta är en slumpmässig uppteckning, visa en knapp som heter "skriv av annan slumpmässig uppteckning" */}
			{ state.random && !state.messageSent &&
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
				<FeedbackButton title={state.title} type="Uppteckning" />
			}
			{
				!config.siteOptions.hideContactButton &&
				<ContributeInfoButton title={state.title} type="Uppteckning" />
			}
			{
				!config.siteOptions.hideContactButton &&
				<TranscriptionHelpButton title={state.title} type="Uppteckning" />
				// <TranscriptionHelpButton title={state.title} type="Uppteckning" {..._props}/>
			}
		</div>

		{overlayContent}

	</div>
	</div>
	);
};
