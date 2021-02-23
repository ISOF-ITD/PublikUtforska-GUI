import React from 'react';
import { Route, Switch } from 'react-router-dom';

import MapMenu from './MapMenu';
import MapView from './views/MapView';
import PlaceView from './views/PlaceView';
import PersonView from './../../ISOF-React-modules/components/views/PersonView';
import RecordView from './views/RecordView';
import RoutePopupWindow from './../../ISOF-React-modules/components/controls/RoutePopupWindow';
import LocalLibraryView from './../../ISOF-React-modules/components/views/LocalLibraryView';
import ImageOverlay from './../../ISOF-React-modules/components/views/ImageOverlay';
import FeedbackOverlay from './../../ISOF-React-modules/components/views/FeedbackOverlay';
import HelpOverlay from './../../ISOF-React-modules/components/views/HelpOverlay';
import ContributeInfoOverlay from './../../ISOF-React-modules/components/views/ContributeInfoOverlay';
import TranscriptionHelpOverlay from './../../ISOF-React-modules/components/views/TranscriptionHelpOverlay';
import TranscriptionOverlay from './../../ISOF-React-modules/components/views/TranscriptionOverlay';
import PopupNotificationMessage from './../../ISOF-React-modules/components/controls/PopupNotificationMessage';
import OverlayWindow from './../../ISOF-React-modules/components/controls/OverlayWindow';
import SitevisionContent from './../../ISOF-React-modules/components/controls/SitevisionContent';

import routeHelper from './../utils/routeHelper';
import WindowScroll from './../../ISOF-React-modules/utils/windowScroll';

import config from './../config.js';

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
			popupVisible: false
		};
	}

	mapMarkerClick(placeId) {
		// När användaren klickar på en prick, lägger till #places/[id] till url:et,
		// detta kommer att hanteras av application router
		this.props.history.push(routeHelper.createPlacePathFromPlaces(placeId, this.props.location.pathname));
	}

	popupCloseHandler() {
		// Lägg till rätt route när användaren stänger popuprutan
		if (this.props.location.pathname.indexOf('records/') > -1) {
			this.props.history.push(routeHelper.createPlacesPathFromRecord(this.props.location.pathname));
		}
		else if (this.props.location.pathname.indexOf('places/') > -1) {
			this.props.history.push(routeHelper.createPlacesPathFromPlace(this.props.location.pathname));
		}
		else {
			var routeParams = routeHelper.createSearchRoute(this.props.match.params);
			this.props.history.push('/places' +(routeParams ? routeParams : ''));
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
		// Not needed for this app?:
		//if (this.props.match.params.nordic) {
		//	window.eventBus.dispatch('nordicLegendsUpdate', null, {includeNordic: true});			
		//}
		// Skickar alla sök-parametrar via global eventBus
		if (window.eventBus) {
			window.eventBus.dispatch('application.searchParams', {
				selectedCategory: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['category'],
				selectedSubcategory: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['subcategory'],
				searchValue: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['search'],
				searchField: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['search_field'],
				searchYearFrom: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['year_from'],
				searchYearTo: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['year_to'],
				searchPersonRelation: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['person_relation'],
				searchGender: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['gender'],
				filter: routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)['filter'],
			});

			window.eventBus.addEventListener('Lang.setCurrentLang', this.languageChangedHandler);

			// Väntar två och halv sekund för att visa intro, om användaren inte har valt att visa den inte igen
			setTimeout(function() {
				if (!localStorage.getItem('neverShowIntro')) {
					eventBus.dispatch('overlay.intro');
				}
			}, 2500);
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

	render() {
		let _props = this.props;

		return (
				<div className={'app-container'+(this.state.popupVisible ? ' has-overlay' : '')}>
					<Switch>
						<Route 
							path={[
								"/person/:person_id",
							]}
							render={() =>
								<RoutePopupWindow
									onShow={this.popupWindowShowHandler}
									onHide={this.popupWindowHideHandler}
									onClose={this.popupCloseHandler}
									router={this.context.router}>
										<PersonView match={this.props.match} />
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
											searchParams={routeHelper.createParamsFromPlacesRoute(props.location.pathname)}
											showOnlyResults={Object.values(routeHelper.createParamsFromPlacesRoute(props.location.pathname)).filter(_ => _).length == 1}
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
									{this.props.popup}
							</RoutePopupWindow>
						}/>
						<Route path = "/records" render={(props) =>
							<RoutePopupWindow
								onShow={this.popupWindowShowHandler}
								onHide={this.popupWindowHideHandler}
								onClose={this.popupCloseHandler}
								router={this.context.router}>
									<RecordView {...props} />
							</RoutePopupWindow>
						}/>
					</Switch>

					<Route path={['/places/:place_id([0-9]+)?', '/records/:record_id']} render={(props) =>
						<MapView
							searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
							onMarkerClick={this.mapMarkerClick}
							defaultMarkerIcon={this.defaultMarkerIcon}
							hideMapmodeMenu={true}
							{...props}
						>

							<MapMenu
								searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
								//searchMetadata={this.state.searchMetadata}
								//selectedCategory={this.state.selectedCategory}
								//selectedSubcategory={this.state.selectedSubcategory}
								// routeHelper={routeHelper}
								{...props}
							/>

							<LocalLibraryView headerText={l('Mina sägner')} history={this.props.history} />

						</MapView>
					}/>
					

					<div className="map-progress"><div className="indicator"></div></div>

					<ImageOverlay />
					<FeedbackOverlay />
					<ContributeInfoOverlay />
					<TranscriptionOverlay {..._props} />
					<TranscriptionHelpOverlay />
					<PopupNotificationMessage />

			</div>
		);
	}
}
