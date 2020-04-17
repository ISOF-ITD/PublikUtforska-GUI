import React from 'react';
import { hashHistory } from 'react-router';

import MapMenu from './MapMenu';
import MapView from './../../ISOF-React-modules/components/views/MapView';
import RoutePopupWindow from './../../ISOF-React-modules/components/controls/RoutePopupWindow';
import LocalLibraryView from './../../ISOF-React-modules/components/views/LocalLibraryView';
import ImageOverlay from './../../ISOF-React-modules/components/views/ImageOverlay';
import FeedbackOverlay from './../../ISOF-React-modules/components/views/FeedbackOverlay';
import HelpOverlay from './../../ISOF-React-modules/components/views/HelpOverlay';
import ContributeInfoOverlay from './../../ISOF-React-modules/components/views/ContributeInfoOverlay';
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
		*/
		window.applicationSettings = {
			includeNordic: false
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

			params: this.props.params,
			popupVisible: false
		};
	}

	mapMarkerClick(placeId) {
		// När användaren klickar på en prick, lägger till #place/[id] till url:et,
		// detta kommer att hanteras av application router
		hashHistory.push(routeHelper.createPlacePathFromPlaces(placeId, this.props.location.pathname));
	}

	popupCloseHandler() {
		// Lägg till rätt route när användaren stänger popuprutan
		if (hashHistory.getCurrentLocation().pathname.indexOf('record/') > -1) {
			hashHistory.push(routeHelper.createPlacesPathFromRecord(hashHistory.getCurrentLocation().pathname));
		}
		else if (hashHistory.getCurrentLocation().pathname.indexOf('place/') > -1) {
			hashHistory.push(routeHelper.createPlacesPathFromPlace(hashHistory.getCurrentLocation().pathname));
		}
		else {
			hashHistory.push('places');
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
		if (this.props.params.nordic) {
			window.eventBus.dispatch('nordicLegendsUpdate', null, {includeNordic: true});			
		}
		// Skickar alla sök-parametrar via global eventBus
		if (window.eventBus) {
			window.eventBus.dispatch('application.searchParams', {
				selectedCategory: this.props.params.category,
				searchValue: this.props.params.search,
				searchField: this.props.params.search_field,
				searchYearFrom: this.props.params.year_from,
				searchYearTo: this.props.params.year_to,
				searchPersonRelation: this.props.params.person_relation,
				searchGender: this.props.params.gender,
				includeNordic: this.props.params.nordic
			});

			window.eventBus.addEventListener('Lang.setCurrentLang', this.languageChangedHandler);

			// Väntar två och halv sekund för att visa intro, om användaren inte har valt att visa den inte igen
			setTimeout(function() {
				if (!localStorage.getItem('neverShowIntro')) {
					eventBus.dispatch('overlay.intro');
				}
			}, 2500);
		}

		// Spara alla sök-parametrar till state
		this.setState({
			selectedCategory: this.props.params.category,
			searchValue: this.props.params.search,
			searchField: this.props.params.search_field,
			searchYearFrom: this.props.params.year_from,
			searchYearTo: this.props.params.year_to,
			searchPersonRelation: this.props.params.person_relation,
			searchGender: this.props.params.gender,
			params: this.props.params
		}, function() {
			setTimeout(function() {
				// Väntar en sekund, lägger till app-initialized till body class,
				// detta kör css transition som animerar gränssnittet i början
				document.body.classList.add('app-initialized');
			}.bind(this), 1000);
		}.bind(this));
	}

	componentWillReceiveProps(props) {
		// När application tar emot parametrar från url:et, skicka dem via eventBus
		// MapView, RecordsList och sökfält tar emot dem och hämtar data
		if (window.eventBus) {
			eventBus.dispatch('application.searchParams', {
				selectedCategory: props.params.category,
				searchValue: props.params.search,
				searchField: props.params.search_field,
				searchYearFrom: props.params.year_from,
				searchYearTo: props.params.year_to,
				searchPersonRelation: props.params.person_relation,
				searchGender: props.params.gender,
				includeNordic: props.params.nordic
			});
		}

		this.setState({
			selectedCategory: props.params.category,
			searchValue: props.params.search,
			searchField: props.params.search_field,
			searchYearFrom: props.params.year_from,
			searchYearTo: props.params.year_to,
			searchPersonRelation: props.params.person_relation,
			searchGender: props.params.gender,
			params: props.params
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
		// Checkar om gränssnittet skulle uppdateras med att jämföra nya parametrar med förre parametrar
		return (JSON.stringify(nextState) != JSON.stringify(this.state));
	}

	render() {
		// Innehåll av RoutePopupWindow, kommer från application route i app.js
		var popup = this.props.popup;

		return (
			<div className={'app-container'+(this.state.popupVisible ? ' has-overlay' : '')}>

				<MapView searchParams={this.state.params} onMarkerClick={this.mapMarkerClick}>

					<MapMenu />

					<LocalLibraryView headerText={l('Mina sägner')} />

				</MapView>

				<RoutePopupWindow onShow={this.popupWindowShowHandler} onHide={this.popupWindowHideHandler} router={this.context.router} onClose={this.popupCloseHandler}>
					{popup}
				</RoutePopupWindow>

				<div className="map-progress"><div className="indicator"></div></div>

				<ImageOverlay />
				<FeedbackOverlay />
				<HelpOverlay />
				<ContributeInfoOverlay />
				<TranscriptionOverlay />
				<PopupNotificationMessage />
				{
					/*
					<OverlayWindow title="Velkommen till sägenkartan">
						<SitevisionContent url={config.startPageUrl} disableScriptExecution={true} />
						<div>
							<hr className="margin-bottom-35"/>
							<button className="button-primary margin-bottom-0" onClick={this.introOverlayCloseButtonClickHandler}>Stäng</button>
							<label className="margin-top-10 margin-bottom-0 font-weight-normal u-pull-right"><input className="margin-bottom-0" onChange={function(event) {this.setState({neverShowIntro: event.currentTarget.checked})}.bind(this)} type="checkbox" /> Klicka här för att inte visa den rutan igen.</label>
						</div>
					</OverlayWindow>
					*/
				}

			</div>
		);
	}
}
