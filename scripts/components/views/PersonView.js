import React from 'react';

import SimpleMap from './../../../ISOF-React-modules/components/views/SimpleMap';
import RecordList from './RecordList';
import ContributeInfoButton from './../../../ISOF-React-modules/components/views/ContributeInfoButton';
import FeedbackButton from './../../../ISOF-React-modules/components/views/FeedbackButton';

import config from './../../../scripts/config.js';

import { Route } from 'react-router-dom';

import routeHelper from './../../../scripts/utils/routeHelper'

export default class PersonView extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {},
			personId: null
		};

		this.url = config.restApiUrl+'persons/';
	}

	componentDidMount() {
		this.fetchData(this.props.match.params);
	}

	fetchData(params) {
		if (params.person_id) {
			fetch(this.url+params.person_id+'/')
				.then(function(response) {
					return response.json()
				}).then(function(json) {
					this.setState({
						data: json
					});
					if(json.name) {
						document.title = json.name;
					}
				}.bind(this)).catch(function(ex) {
					console.log('parsing failed', ex)
				})
			;
		}
	}

	render() {

		//Prepare person county/region:
		let person_county = '';
		if (!!this.state.data.places) {
			if (!!this.state.data.places[0]) {
				let place = this.state.data.places[0];
				if (!!place) {
					person_county = place.name;
					if (!!place.landskap) {
						person_county = person_county + ', ' + place.landskap;
					} 
					// TODO: set landskap = fylke in database and remove this?
					if (!!place.fylke) {
						person_county = person_county + ', ' + place.fylke;
					}
				}
			}
		}

		// Prepare nordic:
		// TODO Replace with "Application defined filter parameter" where it is used (Sägenkartan)
		let nordic = '';
		if (window.applicationSettings) {
			if (window.applicationSettings.includeNordic) {
					nordic = '/nordic/true';
			}
		}

		return (
			<div className={'container'+(this.state.data.id ? '' : ' loading')}>

				<div className="container-header">
					<div className="row">
						<div className="twelve columns">
							<h2>{this.state.data.name || ''}</h2>
							<p>
							{
								(this.state.data.birth_year && this.state.data.birth_year > 0 ? l('Föddes')+' '+this.state.data.birth_year : '')+
								(this.state.data.birth_year && this.state.data.birth_year > 0 && this.state.data.places ? ' i ' : '')
							}
							{
								this.state.data.places && this.state.data.places.length > 0 &&
								<a href={'#places/'+this.state.data.places[0].id+nordic}>{person_county}</a>
							}
							</p>
						</div>
					</div>

					{
						!config.siteOptions.hideContactButton &&
						<FeedbackButton title={this.state.data.name || ''} type="Person" {...this.props} />
					}
					{
						!config.siteOptions.hideContactButton &&
						<ContributeInfoButton title={this.state.data.name || ''} type="Person" />
					}
				</div>

				{
					this.state.data.places && this.state.data.places.length > 0 && this.state.data.places[0].lat && this.state.data.places[0].lng &&
					<div className="row">
						<div className="twelve columns">
							<SimpleMap marker={{lat: this.state.data.places[0].lat, lng: this.state.data.places[0].lng, label: this.state.data.places[0].name}} />
						</div>
					</div>
				}

				<div className="row">

					<div className={(this.state.data.imagepath ? 'eight' : 'twelve')+' columns'}>
						{
							this.state.data.biography &&
							<p dangerouslySetInnerHTML={{__html: this.state.data.biography.replace(/(?:\r\n|\r|\n)/g, '<br />')}} />
						}
					</div>
					{
						this.state.data.imagepath &&
						<div className="four columns">
							<img className="archive-image" src={(config.personImageUrl || config.imageUrl)+this.state.data.imagepath} alt="" />
						</div>
					}

				</div>

				<hr/>

				<div className="row">

					<div className="twelve columns">
						<h3>{l('Uppteckningar')}</h3>
                        <Route 
                            path={"/person/:person_id"}
                            render= {(props) =>
                                <RecordList
                                    disableRouterPagination={true}
                                    disableAutoFetch={true}
                                    searchParams={{person_id: props.match.params.person_id}}
                                />
                            }
                        />
					</div>
				</div>

			</div>
		);
	}
}
