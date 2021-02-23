import React from 'react';
import ListPlayButton from './../../../ISOF-React-modules/components/views/ListPlayButton';
import _ from 'underscore';

import config from './../../../scripts/config.js';

import routeHelper from './../../../scripts/utils/routeHelper'

export default class RecordListItem extends React.Component {
	render() {
		if (config.siteOptions.recordList && config.siteOptions.recordList.displayPlayButton) {
			var audioItem = _.find(this.props.item._source.media, function(item) {
				return item.type == 'audio';
			});
		}

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
				let _props = this.props;
				taxonomyElement = _.compact(_.map(_props.item._source.taxonomy, function(taxonomyItem, i) {
					if (taxonomyItem.category) {
						// when clicking on category, reset all routeParams, except for has_metadata
						let href = '#/places/category/'+taxonomyItem.category.toLowerCase()+(_props.routeParams ? _props.routeParams.replace(/(text_ids\/?|search_field\/?|category\/?|recordtype\/?|search\/?)[^/]+\/?/g, '') : '')
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

		// Prepare transcriptionStatus
		//var transcriptionStatusArr = {'untranscribed':'Ej transkribera', 'readytotranscribe':'<span style="color:red"> Ej avskriven <span style="color:red">', 'transcribed':'Under granskning', 'reviewing':'Under granskning', 'approved':'Avskriven','published':'Avskriven'};
		var transcriptionStatusArr = {'untranscribed':'Ej transkribera', 'readytotranscribe':'Nej', 'transcribed':'Granskas', 'reviewing':'Granskas', 'approved':'Granskas','published':'Ja'};
		var transcriptionStatusElement = '';
		if (this.props.item._source.transcriptionstatus) {
			var transcriptionstatus;
			transcriptionstatus = this.props.item._source.transcriptionstatus;
			transcriptionStatusElement = transcriptionstatus.replace(transcriptionstatus, transcriptionStatusArr[transcriptionstatus]);
		}

		// Prepare title
		let titleText = this.props.item._source.title;
		if (transcriptionStatusElement == 'Granskas') {
			titleText = 'Titel granskas';
		}

		const record_href = (
			config.embeddedApp ? (window.applicationSettings && window.applicationSettings.landingPage ? window.applicationSettings.landingPage : config.siteUrl) : '')
			+'#records/'+this.props.id
			+ routeHelper.createSearchRoute(this.props.searchParams)

		return <tr className={'list-item'+(displayTextSummary ? ' highlighted' : '')}>
			<td className="text-larger">
				<a className="item-title" target={config.embeddedApp ? '_parent' : '_self'} href={record_href}>
					{
						config.siteOptions.recordList && config.siteOptions.recordList.displayPlayButton && audioItem != undefined &&
						<ListPlayButton disablePlayback={true} media={audioItem} recordId={this.props.item._source.id} recordTitle={this.props.item._source.title && this.props.item._source.title != '' ? this.props.item._source.title : l('(Utan titel)')} />
					}
					{titleText && titleText != '' ? titleText : l('(Utan titel)')}
				</a>
				{
					displayTextSummary &&
					<div className="item-summary">{textSummary}</div>
				}
			</td>
			{
				!config.siteOptions.recordList || !config.siteOptions.recordList.hideAccessionpage == true &&
					<td className="table-buttons" data-title={l('Accession:Sida')+':'}>
					{
						this.props.item._source.archive.archive_id + (this.props.item._source.archive.page && ":" || "") + (this.props.item._source.archive.page || "")
					}
				</td>
			}
			{
				!config.siteOptions.recordList || !config.siteOptions.recordList.hideCategories == true &&
				<td className="table-buttons" data-title={l('Kategori')+':'}>
					{
						taxonomyElement
					}
				</td>
			}
			<td className="table-buttons" data-title={l('Socken, Landskap')+':'}>
			{
				this.props.item._source.places && this.props.item._source.places.length > 0 &&
				<a target={config.embeddedApp ? '_parent' : '_self'} href={(config.embeddedApp ? (window.applicationSettings && window.applicationSettings.landingPage ? window.applicationSettings.landingPage : config.siteUrl) : '')+'#places/'+this.props.item._source.places[0].id+(this.props.routeParams ? this.props.routeParams : '')}>{this.props.item._source.places[0].name+(this.props.item._source.places[0].landskap || this.props.item._source.places[0].fylke ? (this.props.item._source.places[0].landskap ? ', '+this.props.item._source.places[0].landskap : this.props.item._source.places[0].fylke ? ', '+this.props.item._source.places[0].fylke : '') : '')}</a>
			}
			</td>
			<td data-title={l('Insamlingsår')+':'}>{this.props.item._source.year ? this.props.item._source.year.split('-')[0] : ''}</td>
			{
				!config.siteOptions.recordList || !config.siteOptions.recordList.hideMaterialType == true &&
				<td data-title={l('Materialtyp')+':'}>{this.props.item._source.materialtype}</td>
				//<td data-title={l('Avskriftstatus')+':'}>{this.props.item._source.transcriptionstatus ? this.props.item._source.transcriptionstatus : ''}</td>
			}
			<td data-title={l('Avskriftstatus')+':'}>{
				transcriptionStatusElement
			}</td>
		</tr>;
	}
}