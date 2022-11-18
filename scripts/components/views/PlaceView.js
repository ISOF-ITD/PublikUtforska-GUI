import React from 'react';

import _ from 'underscore';

import { Route } from 'react-router-dom';

import RecordList from './RecordList';
import PersonList from './../../../ISOF-React-modules/components/views/PersonList';
import SimpleMap from './../../../ISOF-React-modules/components/views/SimpleMap';
import ListPlayButton from './../../../ISOF-React-modules/components/views/ListPlayButton';

import config from './../../../scripts/config.js';

import routeHelper from './../../../scripts/utils/routeHelper'

export default class PlaceView extends React.Component {
	constructor(props) {
		super(props);

		window.placeView = this;

		this.state = {
			data: {},
			placeMarker: {}
		};

		this.url = config.restApiUrl+'locations/';
	}

	handleParams(params) {
		const fetchParams = {...params};

		// TODO: Is 'nordic' needed in this component? Is it for filter on country in placeview or to hand over to subcomponent as RecordList? (or inconsistency if placeid not in current country of map?)
		// country is also set in RecordList! 
		if (params.nordic != 'true') {
			fetchParams.country = config.country;
		}

		// Add Application defined filter parameter
		// Now fetchParams seems to be ignored?!
		// TODO: Use fetchParams as query values in fetch call
		// TODO: MapView uses params.['filter'] instead - should it be the same here?
		if (config.filterParameterName && config.filterParameterValues) {
			if ('filter' in params) {
				if (params['filter'] == 'true' || params['filter'] == true) {
					fetchParams[config.filterParameterName] = config.filterParameterValues[1];
				} else {
					fetchParams[config.filterParameterName] = config.filterParameterValues[0];
				}
			}
		}

		this.fetchData(fetchParams);

		var state = {};
		if (params.type) {
			state['type'] = params.type;
		}
		if (params.category) {
			state['category'] = params.category;
		}
		if (params.place_id) {
			state['recordPlace'] = params.place_id;
		}
		if (params.search) {
			state['searchQuery'] = params.search;
		}
		if (params.search_field) {
			state['searchField'] = params.search_field;
		}
		if (params.record_ids) {
			state['record_ids'] = params.record_ids;
		}
		if (params.has_metadata) {
			state['has_metadata'] = params.has_metadata;
		}
		if (params.gender) {
			state['gender'] = params.gender;
		}
		if (params.person_relation) {
			state['person_relation'] = params.person_relation;
		}
		if (params.birth_years) {
			state['birth_years'] = params.birth_years;
		}
		// TODO: Is 'nordic' needed in this component? Is it for filter on country in placeview or to hand over to subcomponent as RecordList? (or inconsistency if placeid not in current country of map?)
		if (params.nordic) {
			state['nordic'] = true;
		} 
		if (params.recordtype) {
			state['recordtype'] = params.recordtype;
		} 
		if (params.has_media) {
			state['has_media'] = params.has_media;
		}
		if (params.has_transcribed_records) {
			state['has_transcribed_records'] = params.has_transcribed_records;
		}
		if (params.transcriptionstatus) {
			state['transcriptionstatus'] = params.transcriptionstatus;
		}
		this.setState(state);
	}

	componentDidMount() {
		const params = routeHelper.createParamsFromPlacesRoute(
			this.props.location.pathname
		)
		this.handleParams(params);
	}

	fetchData(params) {
		if (params.place_id) {
			fetch(this.url+params.place_id+'/')
				.then(function(response) {
					return response.json()
				}).then(function(json) {
					this.setState({
						data: json
					});
					document.title = json.name.replace(/ sn$/," socken") + ' - ' + config.siteTitle;
				}.bind(this)).catch(function(ex) {
					console.log('parsing failed', ex)
				})
			;
		}
	}

	render() {
		let _props = this.props;
		var informantsItems = this.state.data.informants && this.state.data.informants.length > 0 ? this.state.data.informants.map(function(informant, index) {
			return <tr key={index}>
				<td><a href={'#/person/'+informant.id}>{informant.name}</a></td>
				<td>{informant.birth_year > 0 ? informant.birth_year : ''}</td>
			</tr>;
		}.bind(this)) : [];

		var personsItems = this.state.data.persons && this.state.data.persons.length > 0 ? this.state.data.persons.map(function(person, index) {
			return <tr key={index}>
				<td>
					{
						!config.siteOptions.disablePersonLinks == true ?
						(
							config.siteOptions.disableInformantLinks == true && person.relation == 'i' ?
							person.name :
							<a href={'#/person/'+person.id}>{person.name ? person.name : ''}</a>
						) :
						person.name
					}
				</td>
				<td>{person.birth_year > 0 ? person.birth_year : ''}</td>
			</tr>;
		}.bind(this)) : [];

		var recordsItems = this.state.data.records && this.state.data.records.length > 0 ? this.state.data.records.map(function(record, index) {
			return <tr key={index}>
				<td data-title="">
					<a href={'#/records/'+record.id}>
						{
							record.type == 'inspelning' &&
							<ListPlayButton />
						}
						{record.title ? record.title : '(Untitled)'}
					</a>
				</td>
				<td data-title={l('Kategori')}>{record.taxonomy.name}</td>
				<td data-title={l('Ort')}>
					{record.places &&
						<span>{record.places[0].name+', '+record.places[0].landskap}</span>
					}
				</td>
				<td data-title={l('År')}>{record.year > 0 ? record.year : ''}</td>
				<td data-title={l('Materialtyp')}>{record.materialtype}</td>
			</tr>;
		}.bind(this)) : [];

		return (
			<div className={'container'+(this.state.data.id ? '' : ' loading')}>
		
				<div className="container-header">
					<div className="row">
						<div className="twelve columns">
							<h2>{this.state.data.name && this.state.data.name.replace(/ sn$/," socken")}</h2>
							<p>
								{
									// Comment on replace above:
									// Replace last ' sn' characters
									// 
									// Test: Each country handled different (Not yet working)
									//this.state.data.archive ? this.state.data.archive.country == 'Finland' &&
									//this.state.data.fylke ?
									//<span><strong>{l('Landskap')}</strong>: {this.state.data.fylke}</span> :
									this.state.data.fylke ?
									<span><strong>{l('Fylke')}</strong> {this.state.data.fylke}</span> :
									this.state.data.harad ?
									<span><strong>{l('Härad')}</strong>: {this.state.data.harad}, <strong>{l('Län')}</strong>: {this.state.data.lan}, <strong>{l('Landskap')}</strong>: {this.state.data.landskap}</span>
									: null
								}
							</p>
						</div>
					</div>
				</div>

				{
					!_props.hideMap &&
					<div className="row">
						<div className="twelve columns">
							<SimpleMap marker={this.state.data.location && this.state.data.location.lat && this.state.data.location.lon ? {lat: this.state.data.location.lat, lng: this.state.data.location.lon, label: this.state.data.name} : null} />
						</div>
					</div>
				}

				{
					<div className="row search-results-container">
						<div className="twelve columns">
	
							{
								!this.props.showOnlyResults &&
								<h3>{l('Sökträffar')}</h3>
							}
							<Route 
								path={"/places/:place_id([0-9]+)"}
								render= {(props) =>
									<RecordList 
										key={`PlaceView-RecordList-${props.location.pathname}`}
										disableRouterPagination={true}
										highlightRecordsWithMetadataField={props.highlightRecordsWithMetadataField} 
										searchParams={routeHelper.createParamsFromPlacesRoute(props.location.pathname)}
										{...props}
									/>
								}
							/>

						</div>
					</div>
				}

				{
					!this.props.showOnlyResults &&
					<div>

						{
							this.state.data.records && this.state.data.records.length > 0 &&
							<hr/>
						}

						{
							<div className="row">
								<div className="twelve columns">
									<h3>Samtliga {this.props.searchParams.recordtype === 'one_accession_row' ? 'accessioner' : 'uppteckningar'} från orten</h3>
									<Route 
										path={"/places/:place_id([0-9]+)"}
										render= {(props) =>
											<RecordList 
												disableRouterPagination={true}
												highlightRecordsWithMetadataField={props.highlightRecordsWithMetadataField} 
												searchParams={{
													'place_id': routeHelper.createParamsFromPlacesRoute(props.location.pathname)['place_id'],
													'recordtype':  routeHelper.createParamsFromPlacesRoute(props.location.pathname)['recordtype'],
												}}
											/>
										}
									/>
								</div>
							</div>

						}

					</div>
				}

				{
					!config.siteOptions.placeView || !config.siteOptions.placeView.hideInformantPersonList == true &&
					<div className="row">
						<div className="twelve columns">
							<PersonList personType="informants" title={l('Intervjuade personer')} 
								nordic={this.state.nordic}
								place={this.state.recordPlace}  />
						</div>
					</div>

				}

			</div>
		);
	}
}