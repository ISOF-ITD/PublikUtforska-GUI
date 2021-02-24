import React from 'react';
import routeHelper from './../utils/routeHelper'

export default class FilterSwitch extends React.Component {
	constructor(props) {
		super(props);

		this.menuButtonClick = this.menuButtonClick.bind(this);

		// if (window.eventBus) {
		// 	window.eventBus.addEventListener('application.searchParams', this.receivedSearchParams.bind(this))
		// }

		//console.log('window.applicationSettings.includeNordic:' + window.applicationSettings.includeNordic)
		this.state = {
			filter: false,
			selectedCategory: null
		};
	}

	// receivedSearchParams(event) {
	// 	// debugger;
	// 	this.setState({
	// 		selectedCategory: event.target.selectedCategory,
	// 		filter: event.target.filter
	// 	});
	// }

	componentDidMount() {
		this.setState({
			filter: this.props.searchParams.filter
		})
	}

	UNSAFE_componentWillReceiveProps(props) {
		if(this.props.searchParams.filter !== props.searchParams.filter) {
			this.setState({
				filter: props.searchParams.filter
			})
		}
	}

	menuButtonClick(event) {
		const value = event.currentTarget.dataset.value == 'true';
		this.setState({
			filter: value
		}, function() {
			const params = {...this.props.searchParams}
			params['filter'] = value
			this.props.history.push(
				'/places'
				+ routeHelper.createSearchRoute(params)
				);
			if (window.eventBus) {
				window.eventBus.dispatch('nordicLegendsUpdate', null, {searchMetadata: this.state.searchMetadata});
			}
		}.bind(this));
	}

	render() {
		return <div className="nordic-switch-wrapper map-floating-control">
			<a onClick={this.menuButtonClick} data-value="false" className={this.state.filter == 'true' ? '' : 'selected'}>{l('Allt material')}</a>
			<a onClick={this.menuButtonClick} data-value="true" className={this.state.filter == 'true' ? 'selected' : ''}>{l('För avskrift')}</a>
		</div>;
	}

}