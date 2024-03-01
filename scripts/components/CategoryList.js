import React from 'react';

import categories from '../utils/utforskaCategories';


export default class CategoryList extends React.Component {
	constructor(props) {
		super(props);

		this.itemKeyUpHandler = this.itemKeyUpHandler.bind(this);
	}


	itemKeyUpHandler(event){
		if(event.keyCode == 13){
			this.itemClickHandler(event);
		} 
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
					onClick={this.props.itemClickHandler}
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
					onClick={this.props.itemClickHandler}
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