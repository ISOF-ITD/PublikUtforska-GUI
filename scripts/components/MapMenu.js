import React from 'react';

import CategoryMenu from './CategoryMenu';
import SearchBox from './SearchBox';
import NordicSwitch from './NordicSwitch';

export default class SearchMenu extends React.Component {
	constructor(props) {
		super(props);

		this.searchBoxSizeChangeHandler = this.searchBoxSizeChangeHandler.bind(this);

		this.state = {
			selectedCategory: null,
			expanded: false,
			advanced: false
		};
	}

	componentDidMount() {
		this.setState({
			selectedCategory: this.props.selectedCategory,
			searchValue: this.props.searchValue,
			searchField: this.props.searchField,
			searchYearFrom: this.props.searchYearFrom,
			searchYearTo: this.props.searchYearTo,
			searchPersonRelation: this.props.searchPersonRelation,
			searchGender: this.props.searchGender
		});
	}

	componentWillReceiveProps(props) {
		this.setState({
			selectedCategory: props.selectedCategory,
			searchValue: props.searchValue,
			searchField: props.searchField,
			searchYearFrom: props.searchYearFrom,
			searchYearTo: props.searchYearTo,
			searchPersonRelation: props.searchPersonRelation,
			searchGender: props.searchGender
		});
	}

	searchBoxSizeChangeHandler(event) {
		this.setState({
			expanded: event.expanded,
			advanced: event.advanced
		});
	}

	render() {
		return (
			<div className={'menu-wrapper'+(this.state.expanded ? ' menu-expanded' : '')+(this.state.advanced ? ' advanced-menu-view' : '')}>

				<NordicSwitch />

				<SearchBox ref="searchBox" 
					onSizeChange={this.searchBoxSizeChangeHandler} />

				<CategoryMenu />

			</div>
		);
	}
}