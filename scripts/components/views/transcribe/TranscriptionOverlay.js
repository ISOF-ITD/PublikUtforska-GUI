import React, {
	useState,
	useEffect,
	useCallback,
} from 'react';
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

export default function TranscriptionOverlay(props) {
	const [visible, setVisible] = useState(false);
	const [informantNameInput, setInformantNameInput] = useState('');
	const [informantBirthDateInput, setInformantBirthDateInput] = useState('');
	const [informantBirthPlaceInput, setInformantBirthPlaceInput] = useState('');
	const [informantInformationInput, setInformantInformationInput] = useState('');
	const [messageInput, setMessageInput] = useState('');
	const [messageCommentInput, setMessageCommentInput] = useState('');
	const [nameInput, setNameInput] = useState('');
	const [emailInput, setEmailInput] = useState('');
	const [messageSent, setMessageSent] = useState(false);
	const [messageOnFailure, setMessageOnFailure] = useState('');
	const [currentImage, setCurrentImage] = useState(null); // not used as input value
	const [transcriptionType, setTranscriptionType] = useState('');
	const [randomRecord, setRandomRecord] = useState(false);
	const [images, setImages] = useState([]);
	const [url, setUrl] = useState('');
	const [id, setId] = useState(null);           // not used as input value
	const [archiveId, setArchiveId] = useState(null); // not used as input value
	const [title, setTitle] = useState('');
	const [imageIndex, setImageIndex] = useState(0);
	const [placeString, setPlaceString] = useState('');
	const [transcribeSession, setTranscribeSession] = useState(null); // not used as input value
	const [type, setType] = useState('');

	// Helper functions

	const transcribeStart = useCallback(async (recordId) => {
		const data = { recordid: recordId };

		const formData = new FormData();
		formData.append('json', JSON.stringify(data));

		try {
			const response = await fetch(`${config.restApiUrl}transcribestart/`, {
				method: 'POST',
				body: formData,
			});
			const json = await response.json();

			if (json.success && json.success === 'true') {
				const session = json.data?.transcribesession || false;
				setMessageSent(false);
				setTranscribeSession(session);
			} else {
				setMessageSent(true);
				setMessageOnFailure(json.message || 'Failure!');
			}
		} catch (error) {
			console.error('transcribeStart error:', error);
			setMessageSent(true);
			setMessageOnFailure('Failure!');
		}
	}, []);

	// Cancel transcription — only triggered explicitly by user interactions
	const transcribeCancel = useCallback(
		(keepOverlayVisible = false) => {
			// If we are not done, let the server know we are canceling
			if (!messageSent && id && transcribeSession) {
				const data = {
					recordid: id,
					transcribesession: transcribeSession,
				};

				const formData = new FormData();
				formData.append('json', JSON.stringify(data));

				fetch(`${config.restApiUrl}transcribecancel/`, {
					method: 'POST',
					body: formData,
				}).catch((err) => {
					console.error('transcribeCancel error:', err);
				});
			}

			// Reset everything
			setVisible(keepOverlayVisible === true);
			setInformantNameInput('');
			setInformantBirthDateInput('');
			setInformantBirthPlaceInput('');
			setInformantInformationInput('');
			setMessageInput('');
			setMessageCommentInput('');
			setNameInput('');
			setEmailInput('');
			setMessageSent(false);
			setMessageOnFailure('');
			setCurrentImage(null);
			setTranscriptionType('');
			setRandomRecord(false);
			setUrl('');
			setId(null);
			setArchiveId(null);
			setTitle('');
			setImageIndex(0);
			setPlaceString('');
			setTranscribeSession(null);
			setType('');
			setImages([]);
		},
		[messageSent, id, transcribeSession]
	);

	// Event handlers

	const closeButtonClickHandler = useCallback(() => {
		// Explicitly call our cancel logic when the user hits "Stäng"
		transcribeCancel(false);
	}, [transcribeCancel]);

	const randomButtonClickHandler = useCallback(() => {
		// Keep overlay visible but reset local states
		transcribeCancel(true);
		if (window.eventBus) {
			window.eventBus.dispatch('overlay.transcribe', {
				random: true,
			});
		}
	}, [transcribeCancel]);

	const mediaImageClickHandler = useCallback((event) => {
		const index = event.currentTarget.dataset.index;
		setImageIndex(Number(index));
	}, []);

	const inputChangeHandler = useCallback((event) => {
		const { name, value } = event.target;
		switch (name) {
			case 'informantNameInput':
				setInformantNameInput(value);
				break;
			case 'informantBirthDateInput':
				setInformantBirthDateInput(value);
				break;
			case 'informantBirthPlaceInput':
				setInformantBirthPlaceInput(value);
				break;
			case 'informantInformationInput':
				setInformantInformationInput(value);
				break;
			case 'messageInput':
				setMessageInput(value);
				break;
			case 'messageCommentInput':
				setMessageCommentInput(value);
				break;
			case 'nameInput':
				setNameInput(value);
				break;
			case 'emailInput':
				setEmailInput(value);
				break;
			case 'titleInput':
				setTitle(value);
				break;

			default:
				break;
		}
	}, []);


	const sendButtonClickHandler = useCallback(async () => {
		// Must have at least two words
		const text = messageInput;
		const isMinimum2Words = text.trim().indexOf(' ') !== -1;

		if (!isMinimum2Words) {
			alert(
				l('Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!')
			);
			return;
		}

		const data = {
			transcribesession: transcribeSession,
			url,
			recordid: id,
			recordtitle: title,
			from_email: emailInput,
			from_name: nameInput,
			subject: 'Crowdsource: Transkribering',
			informantName: informantNameInput,
			informantBirthDate: informantBirthDateInput,
			informantBirthPlace: informantBirthPlaceInput,
			informantInformation: informantInformationInput,
			message: messageInput,
			messageComment: messageCommentInput,
		};

		const formData = new FormData();
		formData.append('json', JSON.stringify(data));

		try {
			const response = await fetch(`${config.restApiUrl}transcribe/`, {
				method: 'POST',
				body: formData,
			});
			const json = await response.json();

			if (json.success) {
				// Let other parts of the app know we sent a transcription
				if (window.eventBus) {
					window.eventBus.dispatch('overlay.transcribe.sent');
				}
				setMessageSent(true);
				setMessageOnFailure(json.message);
				// Clear the fields
				setInformantNameInput('');
				setInformantBirthDateInput('');
				setInformantBirthPlaceInput('');
				setInformantInformationInput('');
				setMessageInput('');
				setMessageCommentInput('');
				setNameInput('');
				setEmailInput('');
			} else {
				console.log('Server does not respond for: ' + url);
			}
		} catch (error) {
			console.error('sendButtonClickHandler error:', error);
		}
	}, [
		messageInput,
		transcribeSession,
		url,
		id,
		title,
		emailInput,
		nameInput,
		informantNameInput,
		informantBirthDateInput,
		informantBirthPlaceInput,
		informantInformationInput,
		messageCommentInput,
	]);

	// Form rendering logic

	const renderTranscribeForm = useCallback(() => {
		switch (transcriptionType) {
			case 'uppteckningsblankett':
				return (
					<Uppteckningsblankett
						informantNameInput={informantNameInput ?? ''}
						informantBirthDateInput={informantBirthDateInput ?? ''}
						informantBirthPlaceInput={informantBirthPlaceInput ?? ''}
						informantInformationInput={informantInformationInput ?? ''}
						title={title ?? ''}
						messageInput={messageInput ?? ''}
						inputChangeHandler={inputChangeHandler}
					/>
				);
			case 'fritext':
				return (
					<Fritext
						messageInput={messageInput ?? ''}
						inputChangeHandler={inputChangeHandler}
					/>
				);
			default:
				// Fallback
				return (
					<Uppteckningsblankett
						informantNameInput={informantNameInput ?? ''}
						informantBirthDateInput={informantBirthDateInput ?? ''}
						informantBirthPlaceInput={informantBirthPlaceInput ?? ''}
						informantInformationInput={informantInformationInput ?? ''}
						title={title ?? ''}
						messageInput={messageInput ?? ''}
						inputChangeHandler={inputChangeHandler}
					/>
				);
		}
	}, [
		transcriptionType,
		informantNameInput,
		informantBirthDateInput,
		informantBirthPlaceInput,
		informantInformationInput,
		messageInput,
		title,
		inputChangeHandler,
	]);


	// useEffect for eventBus listeners

	useEffect(() => {
		// Handler for overlay.transcribe
		const handleOverlayTranscribe = (event) => {
			// if (event.target.random) {
			// 	// If random -> fetch a random document
			// 	fetch(
			// 		`${config.apiUrl}random_document/?type=arkiv&recordtype=one_record&transcriptionstatus=readytotranscribe&categorytypes=tradark&publishstatus=published${config.specialEventTranscriptionCategory || ''}`
			// 	)
			// 		.then((response) => response.json())
			// 		.then((json) => {
			// 			const randomDocument = json.hits.hits[0]._source;
			// 			setVisible(true);
			// 			setUrl(`${config.siteUrl}/records/${randomDocument.id}` ?? '');
			// 			setId(randomDocument.id ?? null);
			// 			setArchiveId(randomDocument.archive?.archive_id ?? null);
			// 			setTitle(randomDocument.title ?? '');
			// 			setImages(randomDocument.media || []);
			// 			setTranscriptionType(randomDocument.transcriptiontype || '');
			// 			setImageIndex(0);
			// 			setPlaceString(getPlaceString(randomDocument.places) ?? '');
			// 			setRandomRecord(true);

			// 			transcribeStart(randomDocument.id);
			// 		})
			// 		.catch((err) => {
			// 			// console.error('Failed to fetch random document:', err);
			// 			// visa overlay: "Det finns inga dokument kvar att transkribera"
			// 			setVisible(true);
			// 			setMessageSent(true);
			// 			setMessageOnFailure(
			// 				l('Det finns inga dokument kvar att transkribera.')
			// 			);
			// 			setUrl('');
			// 			setId(null);
			// 			setArchiveId(null);
			// 			setTitle('');
			// 			setImages([]);
			// 			setTranscriptionType('');
			// 		});
			// } else {
				setVisible(true);
				setType(event.target.type ?? '');
				setTitle(event.target.title ?? '');
				setId(event.target.id ?? null);
				setArchiveId(event.target.archiveId ?? null);
				setUrl(event.target.url ?? '');
				setImages(event.target.images || []);
				setTranscriptionType(event.target.transcriptionType || '');
				setImageIndex(0);
				setPlaceString(event.target.placeString || '');
				setRandomRecord(!!event.target.random);

				transcribeStart(event.target.id);
			// }
		};

		// Handler for overlay.hide
		const handleOverlayHide = () => {
			setVisible(false);
		};

		if (window.eventBus) {
			window.eventBus.addEventListener('overlay.transcribe', handleOverlayTranscribe);
			window.eventBus.addEventListener('overlay.hide', handleOverlayHide);
		}

		// Cleanup on unmount: remove event listeners
		return () => {
			if (window.eventBus) {
				window.eventBus.removeEventListener('overlay.transcribe', handleOverlayTranscribe);
				window.eventBus.removeEventListener('overlay.hide', handleOverlayHide);
			}
		};
	}, [transcribeStart]);

	// Note: We removed the auto-cancel on unmount to prevent flicker.
	//       We only call `transcribeCancel()` when the user explicitly closes or randomizes.

	// Render

	if (!visible) return null;

	let overlayContent;

	if (messageSent) {
		const defaultThankYou =
			'Tack för din avskrift som nu skickats till Institutet för språk och folkminnen. Efter granskning kommer den att publiceras.';
		const message = messageOnFailure || defaultThankYou;

		overlayContent = (
			<div>
				<p>{l(message)}</p>
				<p>
					<br />
					<TranscribeButton
						className="button button-primary"
						random
						label={
							randomRecord
								? l('Skriv av en till slumpmässig uppteckning')
								: l('Skriv av en slumpmässigt utvald uppteckning')
						}
					/>
					&nbsp;
					<button className="button-primary" onClick={closeButtonClickHandler}>
						Stäng
					</button>
				</p>
			</div>
		);
	} else {
		const imageItems =
			images &&
			images.map((mediaItem, index) => {
				if (
					mediaItem.source &&
					!mediaItem.source.toLowerCase().endsWith('.pdf')
				) {
					return (
						<img
							data-index={index}
							key={index}
							className="image-item"
							data-image={mediaItem.source}
							onClick={mediaImageClickHandler}
							src={`${config.imageUrl}${mediaItem.source}`}
							alt=""
						/>
					);
				}
				return null;
			});

		overlayContent = (
			<div className="row">
				<div className="four columns">
					{renderTranscribeForm()}

					<label
						htmlFor="transcription_comment"
						className="u-full-width margin-bottom-zero"
					>
						{l('Kommentar till avskriften:')}
					</label>
					<textarea
						lang="sv"
						spellCheck="false"
						id="transcription_comment"
						name="messageCommentInput"
						className="u-full-width margin-bottom-minimal"
						type="text"
						value={messageCommentInput ?? ''}
						onChange={inputChangeHandler}
					/>
					<p>
						{l(
							'Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte.'
						)}
						<br />
						{l('Vi hanterar personuppgifter enligt dataskyddsförordningen. ')}
						<a
							href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html"
							target="_blank"
							rel="noreferrer"
						>
							<strong>{l('Läs mer.')}</strong>
						</a>
					</p>

					<label htmlFor="transcription_name">Ditt namn (frivilligt):</label>
					<input
						id="transcription_name"
						autoComplete="name"
						name="nameInput"
						className="u-full-width"
						type="text"
						value={nameInput ?? ''}
						onChange={inputChangeHandler}
					/>
					<label htmlFor="transcription_email">
						Din e-post adress (frivilligt):
					</label>
					<input
						id="transcription_email"
						autoComplete="email"
						name="emailInput"
						className="u-full-width"
						type="email"
						value={emailInput ?? ''}
						onChange={inputChangeHandler}
					/>

					<button className="button-primary" onClick={sendButtonClickHandler}>
						Skicka
					</button>
				</div>

				<div className="eight columns">
					<ImageMap
						image={
							images && images[imageIndex]
								? config.imageUrl + images[imageIndex].source
								: null
						}
					/>

					<div className="image-list">{imageItems}</div>
				</div>
			</div>
		);
	}

	return (
		<div className="overlay-container visible">
			<div className="overlay-window large">
				<div className="overlay-header">
					{l('Skriv av')}{' '}
					{title ? (
						<>
							&quot;{title}&quot;
						</>
					) : (
						'uppteckning'
					)}
					{archiveId && (
						<small>
							&nbsp;(ur {archiveId}
							{placeString ? ` ${placeString}` : ''})
						</small>
					)}
					{randomRecord && !messageSent && (
						<div className="next-random-record-button-container">
							<TranscribeButton
								label={l('Skriv av annan slumpmässig uppteckning')}
								random
								transcribeCancel={transcribeCancel}
								// onClick={randomButtonClickHandler}
								className="button button-primary next-random-record-button"
							/>
						</div>
					)}
					<button
						title="stäng"
						className="close-button white"
						onClick={closeButtonClickHandler}
					></button>
					{!config.siteOptions.hideContactButton && (
						<FeedbackButton title={title} type="Uppteckning" {...props} />
					)}
					{!config.siteOptions.hideContactButton && (
						<ContributeInfoButton title={title} type="Uppteckning" {...props} />
					)}
					{!config.siteOptions.hideContactButton && (
						<TranscriptionHelpButton
							title={title}
							type="Uppteckning"
							{...props}
						/>
					)}
				</div>
				{overlayContent}
			</div>
		</div>
	);
}
