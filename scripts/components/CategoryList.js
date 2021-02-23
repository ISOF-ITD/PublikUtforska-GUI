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
		this.selectionChangeHandler = this.selectionChangeHandler.bind(this);

		this.state = {
			selectedCategoryName: null,
			selectedCategories: []
		};
	}

	componentDidMount() {
		const category_param = routeHelper.createParamsFromPlacesRoute(this.props.location.pathname).category
		this.setState({
			selectedCategories: category_param ? category_param.split(',') : [],
		});
	}

	UNSAFE_componentWillReceiveProps(props) {
		if (this.props.location.pathname !== props.location.pathname) {
			const category_param = routeHelper.createParamsFromPlacesRoute(props.location.pathname).category
			this.setState({
				selectedCategories: category_param ? category_param.split(',') : [],
			});
		}
	}

	categoryItemClickHandler(event) {
		const params = routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)
		params['category'] = this.state.selectedCategories.join(',')
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

		var selectedCategories = []
		if (this.state.selectedCategories.includes(selectedCategory)) {
			selectedCategories = this.state.selectedCategories.filter(c => c !== selectedCategory)
		} else {
			selectedCategories = this.state.selectedCategories
			selectedCategories.push(selectedCategory)
		}

		this.setState({
			selectedCategories: selectedCategories
		},
		() => this.categoryItemClickHandler(selectedCategory));
	}

	selectionChangeHandler(event) {
		var value = event.target.value;
		var selectedCategories = this.state.selectedCategories;

		if (selectedCategories.indexOf(value) == -1) {
			selectedCategories.push(value);
		}
		else {
			selectedCategories.splice(selectedCategories.indexOf(value), 1);
		}

		this.setState({
			selectedCategories: selectedCategories
		}, function() {
			if (this.props.onChange) {
				this.props.onChange(this.state.selectedCategories);
			}
		}.bind(this));
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
					className={'item'+(this.state.selectedCategories.includes(item.letter) ? ' selected' : '')}
					onClick={this.itemClickHandler}
					onKeyUp={this.itemKeyUpHandler}>
						{item.label}
				</a>;
			}
			else {
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