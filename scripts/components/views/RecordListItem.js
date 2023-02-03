import React from 'react';
import ListPlayButton from './../../../ISOF-React-modules/components/views/ListPlayButton';
import TranscribeButton from '../../../ISOF-React-modules/components/views/TranscribeButton';
import _ from 'underscore';

import config from './../../../scripts/config.js';

import routeHelper from './../../../scripts/utils/routeHelper'
import { pageFromTo, getTitle } from './../../../scripts/utils/helpers'

import RecordsCollection from '../../../ISOF-React-modules/components/collections/RecordsCollection';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';

export default class RecordListItem extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			subrecords: [],
			total: undefined,
			fetchedSubrecords : false,
		}

		this.fetchData = this.fetchData.bind(this);

		this.collections = new RecordsCollection(function(json) {
			if (!json.data || json.data.length == 0) {
				// Om vi hittade inga postar skickar vi visuell meddelande till användaren
				if (window.eventBus) {
					window.eventBus.dispatch('popup-notification.notify', null, l('Inga sökträffar'));
				}
			}

			this.setState({
				subrecords: json.data,
				total: json.metadata.total.value || json.metadata.total, // ES7 vs ES5
				fetchingPage: false
			});
		}.bind(this));
	}

	fetchData() {
		this.setState({
			fetchedSubrecords: true,
		});

		var fetchParams = {
			search: this.props.id,
			recordtype: 'one_record',
		};

		this.collections.fetch(fetchParams);
	}

	renderFieldArchiveId() {
		// If one_accession_row 
		if (this.props.item._source.recordtype == 'one_accession_row') {
			return (
				<td className="table-text" data-title={l('Arkivnummer')+':'}>
					{this.props.item._source.archive.archive_id}
					{
						this.props.item._source.archive.page && (":" + this.props.item._source.archive.page)
					}
				</td>
			); 
		}
		// If one_record
		else if (this.props.item._source.recordtype == 'one_record') {
			return (
			<td className="table-buttons" data-title={l('Arkivnummer')+':'}>
				<span style={{whiteSpace: 'nowrap'}}>
					<a
						data-archiveidrow={this.props.item._source.archive.archive_id_row}
						data-search={this.props.searchParams.search ? this.props.searchParams.search : ''}
						data-recordtype={this.props.searchParams.recordtype} // === 'one_accession_row' ? 'one_record' : 'one_accession_row'}
						onClick={this.props.archiveIdClick}
						title={`Gå till accessionen ${this.props.item._source.archive.archive_id_row}`}
						style={{cursor: this.props.item._source.archive.archive_id_row ? 'pointer':'inherit'}}
						>
						{this.props.item._source.archive.archive_id}
					</a>
					{
						this.props.item._source.archive.page && (":" + pageFromTo(this.props.item))
					}
				</span>
			</td>
			); 
	 	} else {
			// If EVERYTHING ELSE
			return (
				<td className="table-buttons" data-title={l('Arkivnummer')+':'}>
					<span style={{whiteSpace: 'nowrap'}}>
						<a
							data-archiveid={this.props.item._source.archive.archive_id}
							data-recordtype={this.props.searchParams.recordtype === 'one_accession_row' ? 'one_record' : 'one_accession_row'}
							onClick={this.props.archiveIdClick}
							title={`Gå till ${this.props.searchParams.recordtype === 'one_accession_row' ? 'uppteckningarna' : 'accessionerna'}`}
							style={{cursor: 'pointer'}}
							>
							{this.props.item._source.archive.archive_id}
						</a>
						{
							this.props.item._source.archive.page && (":" + this.props.item._source.archive.page)
						}
					</span>
				</td>
				); 
			}
	}

	shouldRenderColumn(column_name) {
		return this.props.shouldRenderColumn(column_name, this.props);
	}

	render() {
		const _this = this;
		if (config.siteOptions.recordList && config.siteOptions.recordList.displayPlayButton) {
			var audioItem = _.find(this.props.item._source.media, function(item) {
				return item.type == 'audio';
			});
		}

		const subrecords = (
			<div className="subrecords">
				{ this.state.fetchedSubrecords === false ?

					<small><a onClick={this.fetchData}><FontAwesomeIcon icon={faFolder} /> Visa uppteckningar ({this.props.item._source.numberofonerecord })</a></small>
					:
					<small><FontAwesomeIcon icon={faFolderOpen} /> Uppteckningar i den här accessionen ({this.props.item._source.numberofonerecord }):</small>
				}
				<ul>
					{this.state.subrecords.sort((a, b) => (parseInt(a._source.archive.page) > parseInt(b._source.archive.page)) ? 1 : -1).map(function(item, index) {
						const published = item._source.transcriptionstatus === 'published';
						return (
							<li key={`subitem${item._source.id}`}><small>
								<a style={{fontWeight: published ? 'bold' : ''}} href={`#/records/${item._source.id}${routeHelper.createSearchRoute(_this.props.searchParams)}`}>Sida {pageFromTo(item)}{published && `: ${item._source.title}`}</a>
							</small></li>
						)
					})
					}
				</ul>
			</div>
		)

		var displayTextSummary = false;
		if (this.props.highlightRecordsWithMetadataField) {
			if (_.findWhere(this.props.item._source.metadata, {type: this.props.highlightRecordsWithMetadataField})) {
				displayTextSummary = true;
				var textSummary = this.props.item._source.text ? (this.props.item._source.text.length > 300 ? this.props.item._source.text.substr(0, 300)+'...' : this.props.item._source.text) : '';
			}
		}

		var taxonomyElement;
		if (this.props.item._source.taxonomy) {
			if (config.siteOptions.recordList && config.siteOptions.recordList.visibleCategories) {
				var visibleCategories = config.siteOptions.recordList.visibleCategories;
			}
			if (this.props.item._source.taxonomy.name) {
				if (visibleCategories) {
					if (visibleCategories.indexOf(this.props.item._source.taxonomy.type.toLowerCase()) > -1) {
						taxonomyElement = <a href={'#/places/category/'+this.props.item._source.taxonomy.category.toLowerCase()+(this.props.routeParams ? this.props.routeParams.replace(/category\/[^/]+/g, '') : '')}>{l(this.props.item._source.taxonomy.name)}</a>;
					}
				}
				else {
					taxonomyElement = <a href={'#/places/category/'+this.props.item._source.taxonomy.category.toLowerCase()+(this.props.routeParams ? this.props.routeParams.replace(/category\/[^/]+/g, '') : '')}>{l(this.props.item._source.taxonomy.name)}</a>;
				}
			}
			else if (this.props.item._source.taxonomy.length > 0 && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideCategories == true)) {
				const _props = this.props;
				taxonomyElement = _.compact(_.map(_props.item._source.taxonomy, function(taxonomyItem, i) {
					if (taxonomyItem.category) {
						const href = '#/places' + routeHelper.createSearchRoute({
							category: taxonomyItem.category.toLowerCase(),
							recordtype: _props.searchParams.recordtype,
							})
						if (visibleCategories) {
							if (visibleCategories.indexOf(taxonomyItem.type.toLowerCase()) > -1) {
							return <a href={href} key={`record-list-item-${_props.id}-${i}`}>{l(taxonomyItem.name)}</a>;
							}
						}
						else {
							return <a href={href}>{l(taxonomyItem.name)}</a>;
						}
					}
				}));
			}
		}

		var collectorPersonElement;
		if (this.props.item._source.persons) {
			if (config.siteOptions.recordList && config.siteOptions.recordList.visibleCollecorPersons == true) {
				if (this.props.item._source.persons.length > 0) {
					const _props = this.props;
					collectorPersonElement = _.compact(_.map(_props.item._source.persons, function(collectorPersonItem, i) {
						if (collectorPersonItem.relation == 'c') {
							var routeParams = '';
							if (_props.routeParams) {
								const _params = routeHelper.createParamsFromSearchRoute(_props.routeParams);
								routeParams = routeHelper.createSearchRoute(_.omit(_params, 'page'));
							}
							const href = '#/person/' + collectorPersonItem.id.toLowerCase() + routeParams;
							return <a href={href} key={`record-list-item-${_props.id}-${i}`}>{l(collectorPersonItem.name)}</a>;
						} else {
							return '';
						}
					}));
				}
			}
		}

		const transcribedByElement = 
		( this.props.item._source.transcribedby ? 
			<span className="transcribed-by">
				{this.props.item._source.transcribedby}
			</span> : ''
		);

		// Prepare transcriptionStatus
		//var transcriptionStatusArr = {'untranscribed':'Ej transkribera', 'readytotranscribe':'<span style="color:red"> Ej avskriven <span style="color:red">', 'transcribed':'Under granskning', 'reviewing':'Under granskning', 'approved':'Avskriven','published':'Avskriven'};
		const transcriptionStatuses = {
			'untranscribed':'',
			'nottranscribable':'',
			'readytotranscribe':'Nej',
			'undertranscription':'Skrivs av',
			'transcribed':'Granskas',
			'reviewing':'Granskas',
			'needsimprovement': 'Granskas',
			'approved':'Granskas',
			'published':'Ja'
		};
		let transcriptionStatusElement = <span />;
		if (this.props.item._source.transcriptionstatus && this.props.item._source.transcriptionstatus !== 'accession') {
			const transcriptionstatus = this.props.item._source.transcriptionstatus;
			transcriptionStatusElement = <span>{transcriptionstatus.replace(transcriptionstatus, transcriptionStatuses[transcriptionstatus])}</span>;
		} else if (this.props.item._source.transcriptionstatus === 'accession' && this.props.item._source.numberofonerecord && Number.isInteger(this.props.item._source.numberoftranscribedonerecord)) {
			const transcribedPercent = this.props.item._source.numberofonerecord === 0 ? 0 : Math.round(this.props.item._source.numberoftranscribedonerecord / this.props.item._source.numberofonerecord * 100);
			transcriptionStatusElement = <div style={{'marginRight': 10}}>
				{`${this.props.item._source.numberoftranscribedonerecord} av ${this.props.item._source.numberofonerecord}`}<br/>
				<div title={`${transcribedPercent}%`} style={{
					display: this.props.item._source.numberofonerecord === 0 ? 'none' : 'inline-block',
					width: '100%',
					maxWidth: 200,
					backgroundColor: '#fff',
					height: 10,
					border: '1px solid #01535d',
					borderRadius: 3,
				}}>
					<span style={{
						width: `${transcribedPercent}%`,
						display: 'block',
						background: '#01535d',
						height: 10
					}} />
				</div>
			</div>;
		}

		// Prepare title
		let titleText;
		if (transcriptionStatusElement == 'Granskas') {
			titleText = 'Titel granskas';
		} else if (this.props.item._source.transcriptionstatus == 'readytotranscribe') {
			titleText = 'Ej avskriven';
		} else {
			titleText = getTitle(this.props.item._source.title, this.props.item._source.contents);
		}

		const record_href = (
			config.embeddedApp ? (window.applicationSettings && window.applicationSettings.landingPage ? window.applicationSettings.landingPage : config.siteUrl) : '')
			+'#/records/'+this.props.id
			+ routeHelper.createSearchRoute(this.props.searchParams)

		return <tr className={'list-item'+(displayTextSummary ? ' highlighted' : '')}>
			{
				this.shouldRenderColumn('title') &&
				<td className="text-larger">
					<a className="item-title" target={config.embeddedApp ? '_parent' : '_self'} href={record_href}>
						{
							config.siteOptions.recordList && config.siteOptions.recordList.displayPlayButton && audioItem != undefined &&
							<ListPlayButton disablePlayback={true} media={audioItem} recordId={this.props.item._source.id} recordTitle={this.props.item._source.title && this.props.item._source.title != '' ? this.props.item._source.title : l('(Utan titel)')} />
						}
						{titleText && titleText != '' && titleText != '[]' ? titleText : l('(Utan titel)')}
						{
							this.props.item._source.media && this.props.item._source.media.filter(m => m.source && m.source.includes('.pdf'))[0] && 
							<sub><img src='img/pdf.gif' style={{'marginLeft': 5}} /></sub>
						}
					</a>
					{
						displayTextSummary &&
						<div className="item-summary">{textSummary}</div>
					}
					{ this.props.item._source.recordtype === "one_accession_row" && this.props.item._source.numberofonerecord !== 0 && subrecords }
					{ this.props.item._source.transcriptionstatus === "readytotranscribe" && this.props.item._source.media.length > 0 && 
						<TranscribeButton
							className="button-primary"
							label={l('Skriv av')}
							title={this.props.item._source.title}
							recordId={this.props.item._source.id}
							images={this.props.item._source.media}
							transcriptionType={this.props.item._source.transcriptiontype}
						/>
					}
				</td>
			}
			{
				this.shouldRenderColumn('archive_id') && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideAccessionpage == true) &&
				 this.renderFieldArchiveId() 			
			}
			{
				this.shouldRenderColumn('category') && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideCategories == true && this.props.searchParams.recordtype !== 'one_accession_row') &&
				<td className="table-buttons" data-title={l('Kategori')+':'}>
					{
						taxonomyElement
					}
				</td>
			}
			{
				this.shouldRenderColumn('place') &&
				<td className="table-buttons" data-title={l('Ort')+':'}>
				{
					this.props.item._source.places && this.props.item._source.places.length > 0 &&
					<a
						target={config.embeddedApp ? '_parent' : '_self'}
						href={(config.embeddedApp ? (window.applicationSettings && window.applicationSettings.landingPage ? window.applicationSettings.landingPage : config.siteUrl) : '')+'#/places/'+this.props.item._source.places[0].id+(routeHelper.createSearchRoute({recordtype: this.props.searchParams.recordtype}))}>
							{this.props.item._source.places[0].name+(this.props.item._source.places[0].landskap || this.props.item._source.places[0].fylke ? (this.props.item._source.places[0].landskap ? ', '+this.props.item._source.places[0].landskap : this.props.item._source.places[0].fylke ? ', '+this.props.item._source.places[0].fylke : '') : '')}
					</a>
				}
				</td>
			}
			{
				this.shouldRenderColumn('collector') && (!config.siteOptions.recordList || config.siteOptions.recordList.visibleCollecorPersons == true) &&
				<td className="table-buttons" data-title={l('Insamlare')+':'}>
					{
						collectorPersonElement
					}
				</td>
			}
			{ 
				this.shouldRenderColumn('year') &&
				<td className="table-text" data-title={l('År')+':'}>{this.props.item._source.year ? this.props.item._source.year.split('-')[0] : ''}</td>
			}
			{
				this.shouldRenderColumn('material_type') && (!config.siteOptions.recordList || !config.siteOptions.recordList.hideMaterialType == true) &&
				<td data-title={l('Materialtyp')+':'}>{this.props.item._source.materialtype}</td>
				//<td data-title={l('Avskriftstatus')+':'}>{this.props.item._source.transcriptionstatus ? this.props.item._source.transcriptionstatus : ''}</td>
			}
			{
				this.shouldRenderColumn('transcription_status') &&
				<td data-title={l('Avskriftstatus')+':'}>
						{transcriptionStatusElement}
				</td>
			}
			{
				// Den här kolumnen måste explicit läggas till i props.columns (används bara för "senast avskrivna" på sidmenyn)

				this.props.columns && this.props.columns.indexOf('transcribedby') > -1 &&
				<td data-title={l('Transkriberad av')+':'}>
						{transcribedByElement}
				</td>
			}
		</tr>;
	}
}