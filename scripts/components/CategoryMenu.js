import React from 'react';
import _ from 'underscore';

import CategoryList from './CategoryList';
// TODO: Seems only for  categories.getCategoryName() - Move categories.getCategoryName() to better place!
import categories from './../../ISOF-React-modules/utils/utforskaCategories.js';

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
			this.props.history.push(
				'/places'
				+(this.props.searchParams.search ? '/search/'+this.props.searchParams.search : '')
				+(this.props.searchParams.search_field ? '/search_field/'+this.props.searchParams.search_field : '')
				+(this.props.searchParams.filter ? '/filter/true' : '')
			);
		}
		else {
			this.props.history.push(
				'/places'
				+(this.props.searchParams.search ? '/search/'+this.props.searchParams.search : '')
				+(this.props.searchParams.search_field ? '/search_field/'+this.props.searchParams.search_field : '')
				+'/category/'+event.selectedCategory
				+(this.props.searchParams.filter ? '/filter/true' : '')
			);
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

				<div tabIndex={-1} className={'list-container minimal-scrollbar'}>
					<CategoryList onItemClick={this.categoryItemClickHandler} ref="categoryList" selectedCategory={this.state.selectedCategory} />
				</div>
			</div>
		);
	}
}