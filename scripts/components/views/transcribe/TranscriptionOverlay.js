import React from 'react';
import config from '../../../config';
import ImageMap from '../ImageMap';
import { l } from '../../../lang/Lang';

import ContributeInfoButton from '../ContributeInfoButton';
import FeedbackButton from '../FeedbackButton';
import TranscriptionHelpButton from './TranscriptionHelpButton';

import Uppteckningsblankett from './transcriptionForms/Uppteckningsblankett';
import Fritext from './transcriptionForms/Fritext';

import { getPlaceString } from '../../../utils/helpers';
import TranscribeButton from './TranscribeButton';

// Main CSS: ui-components/overlay.less
// ImageMap CSS: ui-components/image-map.less

export default class TranscriptionOverlay extends React.Component {
	constructor(props) {
		super(props);

		this.closeButtonClickHandler = this.closeButtonClickHandler.bind(this);

		this.inputChangeHandler = this.inputChangeHandler.bind(this);

		this.mediaImageClickHandler = this.mediaImageClickHandler.bind(this);

		this.sendButtonClickHandler = this.sendButtonClickHandler.bind(this);

		this.randomButtonClickHandler = this.randomButtonClickHandler.bind(this);

		this.state = {
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
		};

		if (window.eventBus) {
			//console.log('TranscriptionOverlay window.eventBus');
			window.eventBus.addEventListener('overlay.transcribe', function(event) {
				if(event.target.random){
					fetch(`${config.apiUrl}random_document/?type=arkiv&recordtype=one_record&transcriptionstatus=readytotranscribe&categorytypes=tradark&publishstatus=published`)
					.then(function(response) {
						return response.json()
					})
					.then(function(json) {
						const randomDocument = json.hits.hits[0]._source;
						this.setState({
							visible: true,
							url: config.siteUrl+'/records/'+randomDocument.id,
							id: randomDocument.id,
							archiveId: randomDocument.archive.archive_id,
							title: randomDocument.title,
							images: randomDocument.media,
							transcriptionType: randomDocument.transcriptiontype,
							imageIndex: 0,
							placeString: getPlaceString(randomDocument.places),
							random: true,
						});
						this.transcribeStart(randomDocument.id);
					}.bind(this));
				} else {
					this.setState({
						visible: true,
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
					}, function() {
						this.transcribeStart(event.target.id);
					}.bind(this));

				}
			}.bind(this));
			window.eventBus.addEventListener('overlay.hide', function(event) {
				this.setState({
					visible: false
				});
			}.bind(this));
		}
	}

	transcribeStart(recordid) {

		var data = {
			recordid: recordid,
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
					

					this.setState({
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
				this.setState({
					// show message:
					messageSent: true,
					messageOnFailure: messageOnFailure
				})
			}
		}.bind(this));
	}

	transcribeCancel(keepOverlayVisible = false) {
		this.setState({
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

		if(!this.state.messageSent) {
			
			// localStorage.removeItem(`transcribesession ${this.state.id}`);
			
			var data = {
				recordid: this.state.id,
				transcribesession: this.state.transcribesession,
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
	}

	closeButtonClickHandler() {
		this.transcribeCancel();
	}

	randomButtonClickHandler() {
		this.transcribeCancel({ keepOverlayVisible: true });
		if(window.eventBus) {
			window.eventBus.dispatch('overlay.transcribe', {
				random: true,
			});
		}
	}

	mediaImageClickHandler(event) {
		this.setState({
			imageIndex: event.currentTarget.dataset.index
		});
	}

	inputChangeHandler(event) {
		this.setState({
			[event.target.name]: event.target.value
		});
	}

	sendButtonClickHandler() {
		//console.log(this.state);
		let text = this.state.messageInput;
		let isMinimum2Words = text.trim().indexOf(' ') != -1;
		if (!isMinimum2Words) {
			alert(l('Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'));
		}
		else {
			var data = {
				transcribesession: this.state.transcribesession,
				url: this.state.url,
				recordid: this.state.id,
				recordtitle: this.state.title,
				from_email: this.state.emailInput,
				from_name: this.state.nameInput,
				subject: "Crowdsource: Transkribering",
				informantName: this.state.informantNameInput,
				informantBirthDate: this.state.informantBirthDateInput,
				informantBirthPlace: this.state.informantBirthPlaceInput,
				informantInformation: this.state.informantInformationInput,
				message: this.state.messageInput,
				messageComment: this.state.messageCommentInput,
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
					this.setState({
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
						console.log('Server does not repond for: ' + this.state.url);
				}
			}.bind(this));
		}
	}

	renderTranscribeForm() {
		// write a switch-statement for the different transcription types
		// and return the correct form
		switch (this.state.transcriptionType) {
			case 'uppteckningsblankett':
				return (
					<Uppteckningsblankett 
						informantNameInput={this.state.informantNameInput}
						informantBirthDateInput={this.state.informantBirthDateInput}
						informantBirthPlaceInput={this.state.informantBirthPlaceInput}
						informantInformationInput={this.state.informantInformationInput}
						title={this.state.title}
						messageInput={this.state.messageInput}
						inputChangeHandler={this.inputChangeHandler} 
						/>
				);
			case 'fritext':
				return (
					<Fritext 
						messageInput={this.state.messageInput}
						inputChangeHandler={this.inputChangeHandler} 
					/>
				);
			default:
				return (
					<Uppteckningsblankett 
						informantNameInput={this.state.informantNameInput}
						informantBirthDateInput={this.state.informantBirthDateInput}
						informantBirthPlaceInput={this.state.informantBirthPlaceInput}
						informantInformationInput={this.state.informantInformationInput}
						title={this.state.title}
						messageInput={this.state.messageInput}
						inputChangeHandler={this.inputChangeHandler} 
					/>
				);
		}
	}

	componentWillUnmount() {
		this.transcribeCancel();
	}

	render() {
		if(!this.state.visible) return null;
		let _props = this.props;

		if (this.state.messageSent) {
			let message = 'Tack för din avskrift som nu skickats till Institutet för språk och folkminnen. Efter granskning kommer den att publiceras.'
			if (this.state.messageOnFailure) {
				message = this.state.messageOnFailure;
			}
			var overlayContent = <div>
				<p>{l(message)}</p>
				<p><br/>
				<TranscribeButton className='button button-primary' random={true} label={
					this.state.random ? l('Skriv av en till slumpmässig uppteckning') : l('Skriv av en slumpmässigt utvald uppteckning')
				} />
				&nbsp;
				<button className="button-primary" onClick={this.closeButtonClickHandler}>Stäng</button></p>
			</div>;
		}
		else {
			if (this.state.images && this.state.images.length > 0) {
				var imageItems = this.state.images.map(function(mediaItem, index) {
					if (mediaItem.source && mediaItem.source.indexOf('.pdf') == -1) {
						return <img data-index={index} key={index} className="image-item" data-image={mediaItem.source} onClick={this.mediaImageClickHandler} src={config.imageUrl+mediaItem.source} alt="" />;
					}
				}.bind(this));
			}

			var overlayContent = <div className="row">

				<div className="four columns">
					{/*
					<p><a href="https://www.isof.se/om-oss/kartor/sagenkartan/transkribera.html"><strong>{l('Läs mer om att skriva av.')}</strong></a><br/><br/></p>

					<hr/>

					*/}
					{this.renderTranscribeForm()}

					<label htmlFor="transcription_comment" className="u-full-width margin-bottom-zero">{l('Kommentar till avskriften:')}</label>
					<textarea lang="sv" spellCheck="false" id="transcription_comment" name="messageCommentInput" className="u-full-width margin-bottom-minimal" type="text" value={this.state.messageCommentInput} onChange={this.inputChangeHandler} />
					<p>{l('Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte.')}
					<br/>{l('Vi hanterar personuppgifter enligt dataskyddsförordningen. ')}<a href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html" target={"_blank"}><strong>{l('Läs mer.')}</strong></a></p>

					<label htmlFor="transcription_name">Ditt namn (frivilligt):</label>
					<input id="transcription_name" autoComplete="name" name="nameInput" className="u-full-width" type="text" value={this.state.nameInput} onChange={this.inputChangeHandler} />
					<label htmlFor="transcription_email">Din e-post adress (frivilligt):</label>
					<input id="transcription_email" autoComplete="email" name="emailInput" className="u-full-width" type="email" value={this.state.emailInput} onChange={this.inputChangeHandler} />

					<button className="button-primary" onClick={this.sendButtonClickHandler}>Skicka</button>
				</div>

				<div className="eight columns">

					<ImageMap image={this.state.images ? config.imageUrl+this.state.images[this.state.imageIndex].source : null} />

					<div className="image-list">
						{imageItems}
					</div>
				</div>

			</div>;
		}

		return <div className='overlay-container visible'>
			<div className="overlay-window large">

				<div className="overlay-header">
					{l('Skriv av')} {this.state.title ? `"${this.state.title}"` : 'uppteckning'}
					{ this.state.archiveId &&
						<small>&nbsp;(ur {this.state.archiveId}{this.state.placeString ? ` ${this.state.placeString}` : ''})</small>
						
					}
					{/* om detta är en slumpmässig uppteckning, visa en knapp som heter "skriv av annan slumpmässig uppteckning" */}
					{ this.state.random && !this.state.messageSent &&
						<div className={'next-random-record-button-container'}>
							<TranscribeButton
								label={l('Skriv av annan slumpmässig uppteckning')}
								random={true}
								onClick={this.randomButtonClickHandler}
								className="button button-primary next-random-record-button"
							/>
						</div>
					}
					<button title="stäng" className="close-button white" onClick={this.closeButtonClickHandler}></button>
					{
						!config.siteOptions.hideContactButton &&
						<FeedbackButton title={this.state.title} type="Uppteckning" {..._props}/>
					}
					{
						!config.siteOptions.hideContactButton &&
						<ContributeInfoButton title={this.state.title} type="Uppteckning" {..._props}/>
					}
					{
						!config.siteOptions.hideContactButton &&
						<TranscriptionHelpButton title={this.state.title} type="Uppteckning" {..._props}/>
					}
				</div>

				{overlayContent}

			</div>
		</div>;
	}
}
