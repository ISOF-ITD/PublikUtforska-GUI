import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import { hashHistory } from 'react-router';

import CategoryList from './CategoryList';
import categories from './../../ISOF-React-modules/utils/sagenkartaCategories.js';

export default class CategoryMenu extends React.Component {
	constructor(props) {
		super(props);

		this.menuButtonClick = this.menuButtonClick.bind(this);
		this.toggleMinimize = this.toggleMinimize.bind(this);
		this.categoryItemClickHandler = this.categoryItemClickHandler.bind(this);

		if (window.eventBus) {
			window.eventBus.addEventListener('application.searchParams', this.receivedSearchParams.bind(this))
		}

		this.state = {
			menuOpen: false,
			selectedCategory: null,
			includeNordic: false,
			minimized: document.documentElement.clientWidth < 500 || false
		};
	}

	categoryItemClickHandler(event) {
		if (event.selectedCategory == this.state.selectedCategory) {
			hashHistory.push('/places'+(this.state.includeNordic ? '/nordic/true' : ''));
		}
		else {
			hashHistory.push('/places/category/'+event.selectedCategory+(this.state.includeNordic ? '/nordic/true' : ''));
		}
	}

	menuButtonClick() {
		this.setState({
			menuOpen: !this.state.menuOpen
		});
	}

	toggleMinimize() {
		this.setState({
			minimized: !this.state.minimized
		});
	}

	receivedSearchParams(event) {
		this.setState({
			selectedCategory: event.target.selectedCategory,
			includeNordic: event.target.includeNordic
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
		return this.state.selectedCategory != nextState.selectedCategory || this.state.minimized != nextState.minimized;
	}

	render() {
		return (
			<div ref="container" className={'heading-list-wrapper'+(this.state.minimized ? ' minimized' : '')}>
				<div className="list-heading panel-heading">
					<span className="heading-label">{l('Kategorier')}<span className="selected-category">
						{
							this.state.selectedCategory ? ': '+categories.getCategoryName(this.state.selectedCategory) : ''
						}
					</span></span>

					<button onClick={this.toggleMinimize} className="minimize-button"><span>Minimera</span></button>
				</div>

				<div className={'list-container minimal-scrollbar'}>
					<CategoryList onItemClick={this.categoryItemClickHandler} ref="categoryList" selectedCategory={this.state.selectedCategory} />
				</div>
			</div>
		);
	}
}