import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';

import categories from './../../ISOF-React-modules/utils/utforskaCategories.js';
//For test with ortnamn data in index:
//import categories from './../../ISOF-React-modules/utils/orLokaltypCategories.js';

import routeHelper from './../utils/routeHelper'

export default class CategoryList extends React.Component {
	constructor(props) {
		super(props);

		this.itemClickHandler = this.itemClickHandler.bind(this);
		this.itemKeyUpHandler = this.itemKeyUpHandler.bind(this);
	}

	categoryItemClickHandler(selectedCategories) {
		const params = routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)
		params['category'] = selectedCategories.join(',')
		const path = "/places" + routeHelper.createSearchRoute(params)
		this.props.history.push(path);
	}

	itemKeyUpHandler(event){
		if(event.keyCode == 13){
			this.itemClickHandler(event);
		} 
	}

	itemClickHandler(event) {
		const selectedCategory = categories.categories[event.target.dataset.index].letter
		let currentSelectedCategories = this.props.searchParams.category && this.props.searchParams.category.split(',')
		let selectedCategories = []
		if (currentSelectedCategories && currentSelectedCategories.includes(selectedCategory)) {
			selectedCategories = currentSelectedCategories.filter(c => c !== selectedCategory)
		} else if (currentSelectedCategories) {
			selectedCategories = currentSelectedCategories
			selectedCategories.push(selectedCategory)
		} else {
			selectedCategories = [selectedCategory]
		}

		this.categoryItemClickHandler(selectedCategories);
	}

	render() {
		var items = categories.categories.map(function(item, index) {
			// TODO: Use l() instead of label_no?
			if (window.currentLang) {
				if (window.currentLang == 'no') {
					item.label = item.label_no;
				}
			};

			if (this.props.multipleSelect) {
				return <a 
					tabIndex={0}
					key={index}
					data-index={index}
					className={'item'+((this.props.searchParams.category && this.props.searchParams.category.split(',').includes(item.letter)) ? ' selected' : '')}
					onClick={this.itemClickHandler}
					onKeyUp={this.itemKeyUpHandler}>
						{item.label}
				</a>;
			}
			else {
				// todo: adjust for multiple select = false
				return <a 
					tabIndex={0}
					key={index}
					data-index={index}
					className={'item'+(item.letter == this.state.selectedCategory ? ' selected' : '')}
					onClick={this.itemClickHandler}
					onKeyUp={this.itemKeyUpHandler}>
						{item.label}
					</a>;
			}
		}.bind(this));

		return (
			<div>
				{items}
			</div>
		);
	}
}