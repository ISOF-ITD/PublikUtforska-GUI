import React from 'react';

import { Route } from 'react-router-dom';
import CategoryList from './CategoryList';
import categories from '../utils/utforskaCategories';
import routeHelper from '../utils/routeHelper';
import { l } from '../lang/Lang';

export default class CategoryMenu extends React.Component {
	constructor(props) {
		super(props);

		this.menuButtonClick = this.menuButtonClick.bind(this);
		this.toggleMinimize = this.toggleMinimize.bind(this);
		// this.categoryItemClickHandler = this.categoryItemClickHandler.bind(this);

		this.state = {
			menuOpen: false,
			includeNordic: false,
			minimized: document.documentElement.clientWidth < 500 || false
		};
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

	render() {
		let selectedCategoriesString = this.props.searchParams.category ? this.props.searchParams.category.split(',').map(category => categories.getCategoryName(category)).join(', ') : ''
		selectedCategoriesString = selectedCategoriesString === '' ? '' : `: ${selectedCategoriesString}`
		return (
			<div ref="container" className={'heading-list-wrapper'+(this.state.minimized ? ' minimized' : '')}>
				<div className="list-heading h-16 pt-6 pr-12 pb-0 pl-6 text-gray-700 bg-slate-100 rounded-t-sm shadow-md transition-all duration-300 ease-in-out">
					<span className="heading-label">{l('Kategorier')}</span><span className="selected-categories">
						{ selectedCategoriesString }
					</span>

					<button onClick={this.toggleMinimize} className="minimize-button"><span>Minimera</span></button>
				</div>

				<div tabIndex={-1} className={'list-container minimal-scrollbar'}>
					<Route
						path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/persons/:person_id']}
						render= {(props) =>
							<CategoryList 
								multipleSelect="true"
								searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
								{...props}
							/>
						}
					/>
				</div>
			</div>
		);
	}
}