import React from 'react';
import { Router } from 'react-router-dom';
//import history from './../../ISOF-React-modules/components/History';

import CategoryMenu from './CategoryMenu';
import SearchBox from './SearchBox';
import NordicSwitch from './NordicSwitch';

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

	componentDidMount() {
		this.setState({
			// remove all, first prop: selectedCategory: this.props.selectedCategory,
		});
	}

	UNSAFE_componentWillReceiveProps(props) {
		this.setState({
			// remove all, first prop: selectedCategory: this.props.selectedCategory,
		});
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
		let _props = this.props
		return (
			<div className={'menu-wrapper'+(this.state.expanded ? ' menu-expanded' : '')+(this.state.advanced ? ' advanced-menu-view' : '')}>

				<NordicSwitch {..._props} />

				<SearchBox ref="searchBox" 
					onSizeChange={this.searchBoxSizeChangeHandler} 
					onSearch={this.searchBoxSearchHandler} 
					{..._props}	
				/>

				<CategoryMenu {..._props} />

			</div>
		);
	}
}