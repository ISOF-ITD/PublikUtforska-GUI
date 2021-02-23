import React from 'react';
import _ from 'underscore';

import CategoryList from './CategoryList';
// TODO: Seems only for  categories.getCategoryName() - Move categories.getCategoryName() to better place!
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
			selectedCategories: [],
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

	shouldComponentUpdate(nextProps, nextState) {
		return this.state.selectedCategories.join(',') !== nextState.selectedCategories.join(',') || this.state.minimized !== nextState.minimized;
	}

	render() {
		let selectedCategoriesString = this.state.selectedCategories.map(category => categories.getCategoryName(category)).join(" ")
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
						path={'/'}
						render= {(props) =>
							<CategoryList 
								multipleSelect="true"
								{...props}
							/>
						}
					/>
				</div>
			</div>
		);
	}
}