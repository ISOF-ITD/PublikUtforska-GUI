import React from 'react';
import { Route } from 'react-router-dom';
import routeHelper from './../utils/routeHelper'

import SearchBox from './SearchBox';
//import NordicSwitch from './NordicSwitch';
import FilterSwitch from './FilterSwitch';

export default class MapMenu extends React.Component {
	constructor(props) {
		super(props);

		this.searchBoxSizeChangeHandler = this.searchBoxSizeChangeHandler.bind(this);
		this.searchBoxSearchHandler = this.searchBoxSearchHandler.bind(this);

		this.state = {
			selectedCategory: null,
			expanded: false,
			advanced: false,
		};
	}

	searchBoxSizeChangeHandler(event) {
		this.setState({
			expanded: event.expanded,
			advanced: event.advanced
		});
	}

	searchBoxSearchHandler(event) {
		this.setState({
			searchValue: event.searchValue,
			searchField: event.searchField,
		}, function() {
			this.updateRoute();
		}.bind(this));
	}

	updateRoute(selectedCategory = this.props.selectedCategory, selectedSubcategory = this.props.selectedSubcategory) {
		// this.props.history.push('/places'+(this.state.searchValue && this.state.searchValue != '' ? '/search/'+this.state.searchValue : '')+(selectedCategory ? '/category/'+selectedCategory+(selectedSubcategory ? ','+selectedSubcategory : '') : '')+(this.state.pointTypeOption == 2 ? '/has_metadata/sitevision_url' : ''));
		this.props.history.push('/places'
			+(this.state.searchValue != '' ? '/search/'+this.state.searchValue+'/search_field/'+this.state.searchField : '')
			+(this.props.searchParams.nordic === "true" ? '/nordic/true' : ''));
	}

	render() {
		// used for the unique key in searchBox
		return (
			<Route
			path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/person/:person_id']}
				render= {(props) =>
					<div className={'menu-wrapper'+(this.state.expanded ? ' menu-expanded' : '')+(this.state.advanced ? ' advanced-menu-view' : '')}>

						<FilterSwitch 
							searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
							{...props} 
						/>

						<SearchBox
							onSizeChange={this.searchBoxSizeChangeHandler} 
							onSearch={this.searchBoxSearchHandler} 
							searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
							{...props}	
						/>

					</div>
				}
			/>
		);
	}
}