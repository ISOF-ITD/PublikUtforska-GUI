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
			currentPage: 1,
			sort: 'archive.archive_id.keyword',
			order: 'asc',
			//sort: undefined,
			//order: undefined,
		};

		this.nextPage = this.nextPage.bind(this);
		this.prevPage = this.prevPage.bind(this);
		this.sort = this.sort.bind(this);
		this.archiveIdClick = this.archiveIdClick.bind(this);

		this.collections = new RecordsCollection(function(json) {
			if (!json.data || json.data.length == 0) {
				// Om vi hittade inga postar skickar vi visuell meddelande till användaren
				if (window.eventBus) {
					window.eventBus.dispatch('popup-notification.notify', null, l('Inga sökträffar<br><br>Kanske informationen inte har skannats? Du kan pröva att söka i den andra av de två flikarna "Accessioner" och "Uppteckningar" utifall informationen finns där.<br><br>Klicka för att stänga meddelandet.'));
				}
			}

			this.setState({
				records: json.data,
				total: json.metadata.total.value || json.metadata.total, // ES7 vs ES5
				totalRelation: json.metadata.total.relation || 'eq', // ES7 vs ES5
				fetchingPage: false
			});
			// Handle new ES7 total value definition with total.relation parameter
			// Needed sometimes if 'track_total_hits' not set in ES-request:
			// total.relation: "eq": output only value
			// total.relation: "gte": output '"more than "+value+" hits"' (value = 10000 for values > 10000)
			let totalPrefixValue = '';
			if (this.state.totalRelation != 'eq') {
				totalPrefixValue = 'mer än ';
			}
			this.setState({totalPrefix: totalPrefixValue});

		}.bind(this));
	
	}

	componentDidMount() {
		this.setState({
			currentPage: this.props.searchParams.page || 1
		}, function() {
			this.fetchData(this.props.searchParams);
		}.bind(this));
	}

	archiveIdClick(event) {
		const archive_id = event.target.dataset.archiveid
		const recordtype = event.target.dataset.recordtype
		const params = {
			search: archive_id,
			recordtype: recordtype,
		}
		this.props.history.push( '/places' + routeHelper.createSearchRoute(params))
		window.eventBus.dispatch('routePopup.show')
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

	sort(event) {
		// debugger;
		this.setState({
			sort: event.target.name,
			order: this.state.order === undefined ? 'asc' : 
				this.state.sort === event.target.name ? (this.state.order === 'asc' ? 'desc' : 'asc') : 'asc',
			currentPage: 1,
		}, function () {
			this.fetchData(this.props.searchParams);
		}.bind(this));
	}
	
	fetchData(params) {
		this.setState({
			fetchingPage: true
		});

		const fetchParams = {
			from: (this.state.currentPage-1)*config.hitsPerPage,
			size: config.hitsPerPage,
			search: params.search || undefined,
			search_field: params.search_field || undefined,
			type: params.type,
			category: params.category && params.category + `${params.subcategory ? ',' + params.subcategory : ''}`, // subcategory for matkartan
			year_from: params.year_from || undefined,
			year_to: params.year_to || undefined,
			gender: params.gender ? (params.person_relation ? params.person_relation+':'+params.gender : params.gender) : undefined,
			// gender: params.gender && params.person_relation ? params.person_relation+':'+params.gender : undefined,
			birth_years: params.birth_years ? (params.person_relation ? params.person_relation+':'+(params.gender ? params.gender+':' : '')+params.birth_years : params.birth_years) : undefined,
			record_ids: params.record_ids || undefined,
			has_metadata: params.has_metadata || undefined,
			has_media: params.has_media || undefined,
			recordtype: params.recordtype || undefined,
			person_id: params.person_id || undefined,
			socken_id: params.place_id || undefined,
			transcriptionstatus: params.transcriptionstatus || undefined,
			sort: this.state.sort || undefined,
			order: this.state.sort && this.state.order ? this.state.order : undefined,
		};

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
		var searchRouteParams = routeHelper.createSearchRoute(this.props.searchParams);

		var items = this.state.records ? this.state.records.map(function(item, index) {
			return <RecordListItem 
					key={item._source.id}
					id={item._source.id}
					item={item} routeParams={searchRouteParams} 
					highlightRecordsWithMetadataField={this.props.highlightRecordsWithMetadataField}
					searchParams={this.props.searchParams}
					archiveIdClick={this.archiveIdClick}
				/>;

		}.bind(this)) : [];

		if (this.state.records) {
			return (
				<div className={'table-wrapper records-list list-container'+(this.state.records.length == 0 ? ' loading' : this.state.fetchingPage ? ' loading-page' : '')}>

					{
						this.state.total > config.hitsPerPage &&
						<div className="">
							<strong>{l('Visar')+' '+((this.state.currentPage*config.hitsPerPage)-(config.hitsPerPage-1))+'-'+(this.state.currentPage*config.hitsPerPage > this.state.total ? this.state.total : this.state.currentPage*config.hitsPerPage)+' '+l('av')+l(this.state.totalPrefix)+' '+this.state.total}</strong>
						</div>
					}

					<table width="100%" className="table-responsive">
						<thead>
							<tr>
								<th scope="col">
									{/*<a className='sort' onClick={this.sort} name='title.raw'>
										{	
											(this.state.sort === 'title.raw') && (this.state.order === 'asc' ? '▼' : '▲')
										*/}
										{l('Titel')}
									{/*</a>*/}
								</th>
								{
									!config.siteOptions.recordList || !config.siteOptions.recordList.hideAccessionpage == true &&
									<th scope="col">
											<a className='sort' onClick={this.sort} name='archive.archive_id.keyword'>
												{	
													(this.state.sort === 'archive.archive_id.keyword') && (this.state.order === 'asc' ? '▼' : '▲')
												}
												{
													l('Arkivnummer')
												}
												{
													this.props.searchParams.recordtype === 'one_record' ? ':Sida' : ''
												}
											</a>
									</th>
								}
								{
									!config.siteOptions.recordList || !config.siteOptions.recordList.hideCategories == true && this.props.searchParams.recordtype !== 'one_accession_row' &&
									<th scope="col">
										<a className='sort' onClick={this.sort} name='taxonomy.category'>
											{	
												(this.state.sort === 'taxonomy.category') && (this.state.order === 'asc' ? '▼' : '▲')
											}
											{l('Kategori')}
										</a>
									</th>
								}
								<th scope="col">{l('Ort')}</th>
								{
									!config.siteOptions.recordList || !config.siteOptions.recordList.visibleCollecorPersons || config.siteOptions.recordList.visibleCollecorPersons == true &&
									<th scope="col">
										{/* TODO: <a className='sort' onClick={this.sort} name='persons'>
											{	
												(this.state.sort === 'persons') && (this.state.order === 'asc' ? '▼' : '▲')
											}*/}
											{l('Insamlare')}
										{/*</a>*/}
									</th>
								}
								<th scope="col">
									<a className='sort' onClick={this.sort} name='year'>
										{	
											(this.state.sort === 'year') && (this.state.order === 'asc' ? '▼' : '▲')
										}
										{l('År')}
									</a>
								</th>
								{
									!config.siteOptions.recordList || !config.siteOptions.recordList.hideMaterialType == true &&
									<th scope="col">{l('Materialtyp')}</th>
								}
								{
									!config.siteOptions.recordList || !config.siteOptions.recordList.hideTranscriptionStatus == true &&
									<th scope="col">
										<a className='sort' onClick={this.sort} name='transcriptionstatus.keyword'>
										{	
											(this.state.sort === 'transcriptionstatus.keyword') && (this.state.order === 'asc' ? '▼' : '▲')
										}
										{l('Avskriven')}
										</a>
									</th>
								}
							</tr>
						</thead>
						<tbody>
							{items}
						</tbody>
					</table>

					{
						this.state.total > config.hitsPerPage &&
						<div className="list-pagination">
							<hr/>
							<p className="page-info"><strong>{l('Visar')+' '+((this.state.currentPage*config.hitsPerPage)-(config.hitsPerPage-1))+'-'+(this.state.currentPage*config.hitsPerPage > this.state.total ? this.state.total : this.state.currentPage*config.hitsPerPage)+' '+l('av')+l(this.state.totalPrefix)+' '+this.state.total}</strong></p><br/>
							<button disabled={this.state.currentPage == 1} className="button prev-button" onClick={this.prevPage}>{l('Föregående')}</button>
							<span> </span>
							<button disabled={this.state.total <= this.state.currentPage*config.hitsPerPage} className="button next-button" onClick={this.nextPage}>{l('Nästa')}</button>
						</div>
					}
				</div>
			);			
		}
		else {
			return (
				<div className="table-wrapper list-container">
					<h3>{l('Inga sökträffar.')}</h3>
				</div>
			);
		}
	}
}