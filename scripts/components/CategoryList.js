import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';

import categories from './../../ISOF-React-modules/utils/sagenkartaCategories.js';

export default class CategoryMenu extends React.Component {
	constructor(props) {
		super(props);

		this.itemClickHandler = this.itemClickHandler.bind(this);
		this.selectionChangeHandler = this.selectionChangeHandler.bind(this);

		this.state = {
			selectedCategory: null,
			selectedCategoryName: null,
			selectedCategories: []
		};
	}

	componentDidMount() {
		this.setState({
			selectedCategory: this.props.selectedCategory,
			selectedCategoryName: categories.getCategoryName(this.props.selectedCategory)
		});
	}

	componentWillReceiveProps(props) {
		if (this.props.selectedCategory !== props.selectedCategory) {
			this.setState({
				selectedCategory: props.selectedCategory,
				selectedCategoryName: categories.getCategoryName(props.selectedCategory)
			});
		}
	}

	itemClickHandler(event) {
		var selectedCategory = {
			selectedCategory: categories.categories[event.target.dataset.index].letter,
			selectedCategoryName: categories.categories[event.target.dataset.index].label
		};

		this.setState(selectedCategory);

		if (this.props.onItemClick) {
			this.props.onItemClick(selectedCategory);
		}
	}

	selectionChangeHandler(event) {
		console.log(event.target.value);
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
			if (this.props.multipleSelect) {
				return <label key={index} data-index={index} className="item"><input value={item.letter} onChange={this.selectionChangeHandler} type="checkbox"/>{item.label}</label>;
			}
			else {
				return <a key={index} data-index={index} className={'item'+(item.letter == this.state.selectedCategory ? ' selected' : '')} onClick={this.itemClickHandler}>{item.label}</a>;
			}
		}.bind(this));

		return (
			<div>
				{items}
			</div>
		);
	}
}