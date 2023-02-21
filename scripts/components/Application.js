import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ReactDOM from 'react-dom';

import MapMenu from './MapMenu';
import MapView from './views/MapView';
import PlaceView from './views/PlaceView';
import PersonView from './views/PersonView';
import RecordView from './views/RecordView';
import RoutePopupWindow from './RoutePopupWindow';
import StatisticsOverlay from './StatisticsOverlay';
import LocalLibraryView from './../../ISOF-React-modules/components/views/LocalLibraryView';
import ImageOverlay from './../../ISOF-React-modules/components/views/ImageOverlay';
import FeedbackOverlay from './../../ISOF-React-modules/components/views/FeedbackOverlay';
import HelpOverlay from './../../ISOF-React-modules/components/views/HelpOverlay';
import ContributeInfoOverlay from './../../ISOF-React-modules/components/views/ContributeInfoOverlay';
import TranscriptionHelpOverlay from './../../ISOF-React-modules/components/views/TranscriptionHelpOverlay';
import TranscriptionOverlay from './../../ISOF-React-modules/components/views/TranscriptionOverlay';
import PopupNotificationMessage from './../../ISOF-React-modules/components/controls/PopupNotificationMessage';
import SwitcherHelpTextOverlay from './views/SwitcherHelpTextOverlay';
import TranscribeButton from '../../ISOF-React-modules/components/views/TranscribeButton';
import RecordListWrapper from './views/RecordListWrapper';

import routeHelper from './../utils/routeHelper';

import folkelogga from './../../img/folkelogga.svg';

import config from '../config';
import EventBus from 'eventbusjs';

export default class Application extends React.Component {
	constructor(props) {
		super(props);

		// Lägg till globalt eventBus variable för att skicka data mellan moduler
		window.eventBus = EventBus;

		/* Global applicationSettings, includeNordic = false betyder att vi inkluderar inte norskt material som standard
			includeNordic används av ISOF-React-modules/components/collections/MapCollection.js och
			ISOF-React-modules/components/collections/RecordsCollection.js i Nordisk_sägenkarta branchen.
			TODO: Not needed for this app.
		*/
		window.applicationSettings = {
			includeNordic: true
		};

		// Bind all event handlers to this (the actual component) to make component variables available inside the functions
		this.mapMarkerClick = this.mapMarkerClick.bind(this);
		this.popupCloseHandler = this.popupCloseHandler.bind(this);
		this.popupWindowHideHandler = this.popupWindowHideHandler.bind(this);
		this.popupWindowShowHandler = this.popupWindowShowHandler.bind(this);
		this.introOverlayCloseButtonClickHandler = this.introOverlayCloseButtonClickHandler.bind(this);

		this.languageChangedHandler = this.languageChangedHandler.bind(this);

		this.languageChangedHandler = this.languageChangedHandler.bind(this);

		this.state = {
			selectedCategory: null,

			searchValue: '',
			searchField: '',

			//params: this.props.match.params,
			match: {},
			popupVisible: false,

			// deactivated expanded menu for now
			// menuExpanded: false,
			menuExpanded: true,
		};

		this.popup = 
			<RecordListWrapper
				manuallyOpenPopup={true}
				openButtonLabel="Visa sökträffar som lista"
				disableRouterPagination={false}
				// highlightRecordsWithMetadataField="has_media"
				searchParams={routeHelper.createParamsFromSearchRoute(location.pathname.split(match.url)[1])}
			/>
		
	}

	mapMarkerClick(placeId) {
		// När användaren klickar på en prick, lägger till #places/[id] till url:et,
		// detta kommer att hanteras av application router
		this.props.history.push(routeHelper.createPlacePathFromPlaces(placeId, this.props.location.pathname));
	}

	popupCloseHandler() {
		// Lägg till rätt route när användaren stänger popuprutan
		if (this.props.location.pathname.indexOf('records/') > -1) {
			this.props.history.push(
				'/places'
				+ routeHelper.createSearchRoute(
					routeHelper.createParamsFromRecordRoute(this.props.location.pathname)
				)
			);
		}
		else if (this.props.location.pathname.indexOf('places/') > -1) {
			this.props.history.push(
				'/places'
				+ routeHelper.createSearchRoute(
					routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)
				)
			);
		}
		else {
			this.props.history.push(
				'/places'
				+ routeHelper.createSearchRoute(
					routeHelper.createParamsFromSearchRoute(this.props.location.pathname.split(this.props.match.url)[1])
				)
			);
		}
	}

	popupWindowShowHandler() {
		// När popup-rutan är synlig, lägg till popupVisible: true till state,
		// i render() lägger detta till has-overlay class till <div id="app" />
		setTimeout(function() {
			this.setState({
				popupVisible: true
			});
		}.bind(this), 10);
	}

	popupWindowHideHandler() {
		// När popup-rutan är döljd, lägg till popupVisible: false till state
		setTimeout(function() {
			this.setState({
				popupVisible: false
			});
		}.bind(this), 10);
	}

	introOverlayCloseButtonClickHandler() {
		// Skickar overlay.hide via globala eventBus, OverlayWindow tar emot det
		eventBus.dispatch('overlay.hide');

		// Registrerar till localStorage om användaren har valt att inte visa intro igen
		if (this.state.neverShowIntro) {
			localStorage.setItem('neverShowIntro', true);
		}
	}

	languageChangedHandler() {
		// force render när språk har ändras
		this.forceUpdate();
	}

	componentDidMount() {
		document.getElementById('app').addEventListener('click', this.windowClickHandler.bind(this));
		document.title = config.siteTitle;
		// Not needed for this app?:
		//if (this.props.match.params.nordic) {
		//	window.eventBus.dispatch('nordicLegendsUpdate', null, {includeNordic: true});			
		//}
		// Skickar alla sök-parametrar via global eventBus
		if (window.eventBus) {
			// window.eventBus.dispatch('application.searchParams', {
			// 	selectedCategory: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['category'],
			// 	selectedSubcategory: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['subcategory'],
			// 	searchValue: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['search'],
			// 	searchField: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['search_field'],
			// 	searchYearFrom: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['year_from'],
			// 	searchYearTo: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['year_to'],
			// 	searchPersonRelation: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['person_relation'],
			// 	searchGender: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['gender'],
			// 	filter: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['filter'],
			// });

			// window.eventBus.addEventListener('Lang.setCurrentLang', this.languageChangedHandler);

			// // Väntar två och halv sekund för att visa intro, om användaren inte har valt att visa den inte igen
			// setTimeout(function() {
			// 	if (!localStorage.getItem('neverShowIntro')) {
			// 		eventBus.dispatch('overlay.intro');
			// 	}
			// }, 2500);
		}

		setTimeout(function() {
			// Väntar en sekund, lägger till app-initialized till body class,
			// detta kör css transition som animerar gränssnittet i början
			document.body.classList.add('app-initialized');
		}.bind(this), 1000);
	}

	shouldComponentUpdate(nextProps, nextState) {
		// Checkar om gränssnittet skulle uppdateras med att jämföra nya parametrar med förre parametrar
		return (JSON.stringify(nextState) != JSON.stringify(this.state));
	}

	componentDidUpdate(prevProps, prevState) {
		// återställ title vid varje uppdatering
		document.title = config.siteTitle;
	}

	windowClickHandler(event) {
		eventBus.dispatch('screen-clicked');
	}

	render() {

		return (
				<div className={'app-container'+(this.state.popupVisible ? ' has-overlay' : '')}>
					<Routes>
						<Route 
							path={[
								"/statistics",
							]}
							render={() =>
								<RoutePopupWindow
									onShow={this.popupWindowShowHandler}
									onHide={this.popupWindowHideHandler}
									onClose={this.popupCloseHandler}
									router={this.context.router}>
									<StatisticsOverlay />
								</RoutePopupWindow>
							}
						/>
						<Route 
							path={[
								"/person/:person_id",
							]}
							render={(props) =>
								<RoutePopupWindow
									onShow={this.popupWindowShowHandler}
									onHide={this.popupWindowHideHandler}
									onClose={this.popupCloseHandler}
									router={this.context.router}>
										<PersonView 
											key={`Application-PersonView-${props.match.params.person_id}`}
											{...props}
										/>
								</RoutePopupWindow>
							}
						/>
						<Route 
							path={[
								"/places/:place_id([0-9]+)",
							]}
							render= {(props) =>
								<RoutePopupWindow
									onShow={this.popupWindowShowHandler}
									onHide={this.popupWindowHideHandler}
									onClose={this.popupCloseHandler}
									router={this.context.router}>
										<PlaceView 
											{...props}
											key={`Application-Place-View-${routeHelper.createParamsFromPlacesRoute(props.location.pathname).place_id}`}
											searchParams={routeHelper.createParamsFromPlacesRoute(props.location.pathname)}
											// Om det bara finns två searchParams (vilka måste vara place_id och recordtype), visa inte
											// listan med "samtliga träffar från orten", eftersom det skulle vara samma lista
											showOnlyResults={Object.values(routeHelper.createParamsFromPlacesRoute(props.location.pathname)).filter(_ => _).length <= 2}
										/>
								</RoutePopupWindow>
							}
						/>

						<Route path = "/places" render={() =>
							<RoutePopupWindow
								onShow={this.popupWindowShowHandler}
								onHide={this.popupWindowHideHandler}
								onClose={this.popupCloseHandler}
								router={this.context.router}>
									<RecordListWrapper
										manuallyOpenPopup={true}
										openButtonLabel="Visa sökträffar som lista"
										disableRouterPagination={false}
										// highlightRecordsWithMetadataField="has_media"
										searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(match.url)[1])}
									/>
							</RoutePopupWindow>
						}/>
						<Route path = "/records" render={(props) =>
							<RoutePopupWindow
								onShow={this.popupWindowShowHandler}
								onHide={this.popupWindowHideHandler}
								onClose={this.popupCloseHandler}
								router={this.context.router}>
									<RecordView 
										key={`Application-RecordView-${routeHelper.createParamsFromRecordRoute(this.props.location.pathname).record_id}`}
										{...props} 
										searchParams={routeHelper.createParamsFromRecordRoute(props.location.pathname)}
									/>
							</RoutePopupWindow>
						}/>
					</Routes>

					<Route
						path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/person/:person_id']} 
						render={(props) =>
							<MapView
								searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
								onMarkerClick={this.mapMarkerClick}
								defaultMarkerIcon={this.defaultMarkerIcon}
								hideMapmodeMenu={true}
								{...props}
							>
								<MapMenu
									searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
									{...props}
									expanded={this.state.menuExpanded}
								/>
								<div className="map-bottom-wrapper">

									<div className='popup-wrapper'>
										<TranscribeButton className="popup-open-button map-bottom-control map-floating-control visible"
												label={l('Skriv av slumpmässig uppteckning')}
												random={true}
												// label={this.state.randomDocument._source.id}
												// title={this.state.randomDocument._source.title}
												// recordId={this.state.randomDocument._source.id}
												// images={this.state.randomDocument._source.media}
												// transcriptionType={this.state.randomDocument._source.transcriptiontype}
										/>
									</div>

									{/* <div className='popup-wrapper'>
										<a className="popup-open-button map-floating-control map-bottom-control visible" onClick={this.openButtonClickHandler} onKeyUp={this.openButtonKeyUpHandler} tabIndex={0}>
											<strong>{l('Visa statistik')}</strong>
										</a>
									</div> */}

									<div className='popup-wrapper'>
										<LocalLibraryView headerText={l('Mina sägner')} history={this.props.history} />
									</div>
								</div>

							</MapView>
						}
					/>
					

					<div className="map-progress"><div className="indicator"></div></div>

					<ImageOverlay />
					<FeedbackOverlay />
					<ContributeInfoOverlay />
					<TranscriptionOverlay {...this.props} />
					<TranscriptionHelpOverlay />
					<SwitcherHelpTextOverlay />
					<PopupNotificationMessage />
					{/* en statistik-overlay som lägger sig över sidan från vänster och täcker ungefär halva bredden */}
					<StatisticsOverlay
						// copy props from Application to StatisticsOverlay and keep them in sync
						{...this.props}
					/>

				<footer>
					<div className="logo">
						<div id="Logo" className="isof-app-header">
							{/* Logo */}
							<a href="https://www.isof.se/arkiv-och-insamling/digitala-arkivtjanster/folke">
								<img
								alt="Folke på Institutet för språk och folkminnen" className="sv-noborder"
								style={{ maxWidth: 326, maxHeight: 50 }} src={folkelogga} />
							</a>
						</div>
						<div id="portal" className="isof-app-header">
							<a href="https://www.isof.se/arkiv-och-insamling/digitala-arkivtjanster/folke" target="_blank"
								className="normal" style={{display: 'block'}}>Om Folke</a>
						</div>
					</div>
				</footer >

			</div>
		);
	}
}
