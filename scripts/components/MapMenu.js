import React from 'react';
import { Route } from 'react-router-dom';
import routeHelper from './../utils/routeHelper'

import SearchBox from './SearchBox';
//import NordicSwitch from './NordicSwitch';
import FilterSwitch from './FilterSwitch';

export default class MapMenu extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedCategory: null,
			// expanded: false,
			advanced: false,
		};
	}

	searchBoxSearchHandler(event) {
		this.setState({
			searchValue: event.searchValue,
			searchField: event.searchField,
		}, function() {
			this.updateRoute();
		}.bind(this));
	}

	render() {
		// used for the unique key in searchBox
		return (
			<Route
			path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/person/:person_id']}
				render= {(props) =>
					<div className={'menu-wrapper'+(this.props.expanded ? ' menu-expanded' : '')+(this.state.advanced ? ' advanced-menu-view' : '')}>

						<FilterSwitch 
							searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
							{...props} 
						/>

						<SearchBox
							key={props.location.pathname.split(props.match.url)[1]}
							searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
							expanded={this.props.expanded}
							{...props}	
						/>

					</div>
				}
			/>
		);
	}
}