import React from 'react';
import routeHelper from './../utils/routeHelper'

export default class FilterSwitch extends React.Component {
	constructor(props) {
		super(props);
		this.menuButtonClick = this.menuButtonClick.bind(this);
	}

	menuButtonClick(event) {
		const value = event.currentTarget.dataset.value == 'true';
		const params = {...this.props.searchParams};
		params['filter'] = value;
		this.props.history.push(
			'/places'
			+ routeHelper.createSearchRoute(params)
			);
	}

	render() {
		return <div className="nordic-switch-wrapper map-floating-control">
			<a onClick={this.menuButtonClick} data-value="false" className={this.props.searchParams.filter == 'true' ? '' : 'selected'}>{l('Allt material')}</a>
			<a onClick={this.menuButtonClick} data-value="true" className={this.props.searchParams.filter == 'true' ? 'selected' : ''}>{l('För avskrift')}</a>
		</div>;
	}

}