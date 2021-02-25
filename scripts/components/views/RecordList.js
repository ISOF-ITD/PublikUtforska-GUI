import React from 'react';

import RecordsCollection from './../../../ISOF-React-modules/components/collections/RecordsCollection';
import RecordListItem from './RecordListItem';

import config from './../../../scripts/config.js';
import routeHelper from './../../../scripts/utils/routeHelper';

export default class RecordList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			records: [],
			fetchingPage: false,
			currentPage: 1
		};

		this.nextPage = this.nextPage.bind(this);
		this.prevPage = this.prevPage.bind(this);

		this.collections = new RecordsCollection(function(json) {
			if (!json.data || json.data.length == 0) {
				// Om vi hittade inga postar skickar vi visuell meddelande till användaren
				if (window.eventBus) {
					window.eventBus.dispatch('popup-notification.notify', null, l('Inga sökträffar'));
				}
			}

			this.setState({
				records: json.data,
				total: json.metadata.total.value || json.metadata.total, // ES7 vs ES5
				fetchingPage: false
			});
		}.bind(this));
	}

	componentDidMount() {
		this.setState({
			currentPage: this.props.searchParams.page || 1
		}, function() {
			this.fetchData(this.props.searchParams);
		}.bind(this));
	}

	nextPage() {
		/*
			På vanliga sättet använder vi routern för att säga till vilken sida vi hämtar,
			i moduler som innehåller RecordList (PlaceView, PersonView) lägger vi till disableRouterPagination={true}
			till RecordList, då hämtar vi ny sida direkt utan att använda routern
		*/
		if (this.props.disableRouterPagination) {
			this.setState({
				currentPage: this.state.currentPage+1
			}, function() {
				this.fetchData(this.props.searchParams);
			}.bind(this));
		}
		else {
			// Skapar ny router adress via routeHelper, den är baserad på nuvarande params och lägger till ny siffra i 'page'
			this.props.history.push('/places'+routeHelper.createSearchRoute(this.props.searchParams)+'/page/'+(Number(this.state.currentPage)+1));
		}
	}
	
	prevPage() {
		/*
			På vanliga sättet använder vi routern för att säga till vilken sida vi hämtar,
			i moduler som innehåller RecordList (PlaceView, PersonView) lägger vi till disableRouterPagination={true}
			till RecordList, då hämtar vi ny sida direkt utan att använda routern
		*/
		if (this.props.disableRouterPagination) {
			this.setState({
				currentPage: this.state.currentPage-1
			}, function() {
				this.fetchData(this.props.searchParams);
			}.bind(this));
		}
		else {
			// Skapar ny router adress via routeHelper, den är baserad på nuvarande params och lägger till ny siffra i 'page'
			this.props.history.push('/places'+routeHelper.createSearchRoute(this.props.searchParams)+'/page/'+(Number(this.state.currentPage)-1));
		}
	}
	
	fetchData(params) {
		this.setState({
			fetchingPage: true
		});

		const fetchParams = {...params}
		delete fetchParams.place_id
		fetchParams['socken_id'] = params.place_id
		fetchParams['from'] = (this.state.currentPage-1)*50
		fetchParams['size'] = 50
		fetchParams['birth_years'] = params.birth_years ? (params.person_relation ? params.person_relation+':'+(params.gender ? params.gender+':' : '')+params.birth_years : params.birth_years) : undefined

		// Add Application defined filter parameter
		if (config.filterParameterName && config.filterParameterValues) {
			if (params && 'filter' in params) {
				if (params['filter'] == 'true' || params['filter'] == true) {
					fetchParams[config.filterParameterName] = config.filterParameterValues[1];
				} else {
					fetchParams[config.filterParameterName] = config.filterParameterValues[0];
				}
			}
		}

		this.collections.fetch(fetchParams);
	}

	render() {
		var searchRouteParams = routeHelper.createSearchRoute(this.props);

		var items = this.state.records ? this.state.records.map(function(item, index) {
			return <RecordListItem 
					key={item._source.id}
					id={item._source.id}
					item={item} routeParams={searchRouteParams} 
					highlightRecordsWithMetadataField={this.props.highlightRecordsWithMetadataField}
					searchParams={this.props.searchParams}
				/>;

		}.bind(this)) : [];

		if (this.state.records) {
			return (
				<div className={'table-wrapper records-list list-container'+(this.state.records.length == 0 ? ' loading' : this.state.fetchingPage ? ' loading-page' : '')}>

					{
						this.state.total > 50 &&
						<div className="">
							<strong>{l('Visar')+' '+((this.state.currentPage*50)-49)+'-'+(this.state.currentPage*50 > this.state.total ? this.state.total : this.state.currentPage*50)+' '+l('av')+' '+this.state.total}</strong>
						</div>
					}

					<table width="100%" className="table-responsive">
						<thead>
							<tr>
								<th scope="col">{l('Titel')}</th>
								{
									!config.siteOptions.recordList || !config.siteOptions.recordList.hideAccessionpage == true &&
									<th scope="col">{l('Accession:Sida')}</th>
								}
								{
									!config.siteOptions.recordList || !config.siteOptions.recordList.hideCategories == true &&
									<th scope="col">{l('Kategori')}</th>
								}
								<th scope="col">{l('Socken, Landskap')}</th>
								<th scope="col">{l('Insamlingsår')}</th>
								{
									!config.siteOptions.recordList || !config.siteOptions.recordList.hideMaterialType == true &&
									<th scope="col">{l('Materialtyp')}</th>
								}
								{
									!config.siteOptions.recordList || !config.siteOptions.recordList.hideTranscriptionStatus == true &&
									<th scope="col">{l('Avskriven')}</th>
								}
							</tr>
						</thead>
						<tbody>
							{items}
						</tbody>
					</table>

					{
						this.state.total > 50 &&
						<div className="list-pagination">
							<hr/>
							<p className="page-info"><strong>{l('Visar')+' '+((this.state.currentPage*50)-49)+'-'+(this.state.currentPage*50 > this.state.total ? this.state.total : this.state.currentPage*50)+' '+l('av')+' '+this.state.total}</strong></p><br/>
							<button disabled={this.state.currentPage == 1} className="button prev-button" onClick={this.prevPage}>{l('Föregående')}</button>
							<span> </span>
							<button disabled={this.state.total <= this.state.currentPage*50} className="button next-button" onClick={this.nextPage}>{l('Nästa')}</button>
						</div>
					}
				</div>
			);			
		}
		else {
			return (
				<div className="table-wrapper list-container">
					<h3>{l('Inga sökträffar')}</h3>
				</div>
			);
		}
	}
}