import React from 'react';
import _ from 'underscore';

import CategoryList from './CategoryList';
import categories from './../../ISOF-React-modules/utils/utforskaCategories';
import { Route } from 'react-router-dom';
import routeHelper from './../utils/routeHelper'

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
				<div className="list-heading panel-heading">
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