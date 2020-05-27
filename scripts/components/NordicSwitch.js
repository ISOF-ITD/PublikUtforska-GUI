import React from 'react';
import ReactDOM from 'react-dom';

export default class NordicSwitch extends React.Component {
	constructor(props) {
		super(props);

		this.menuButtonClick = this.menuButtonClick.bind(this);

		if (window.eventBus) {
			window.eventBus.addEventListener('application.searchParams', this.receivedSearchParams.bind(this))
		}

		//console.log('window.applicationSettings.includeNordic:' + window.applicationSettings.includeNordic)
		this.state = {
			includeNordic: false,
			selectedCategory: null
		};
	}

	receivedSearchParams(event) {
		this.setState({
			selectedCategory: event.target.selectedCategory,
			includeNordic: event.target.includeNordic
		});
	}

	menuButtonClick(event) {
		this.setState({
			includeNordic: event.currentTarget.dataset.value == 'true'
		}, function() {
			if (window.eventBus) {
				window.eventBus.dispatch('nordicLegendsUpdate', null, {includeNordic: this.state.includeNordic});
			}
	
			this.props.history.push('/places'+(this.state.selectedCategory ? '/category/'+this.state.selectedCategory : '')+(this.state.includeNordic ? '/nordic/true' : ''));
		}.bind(this));
	}

	render() {
		return <div className="nordic-switch-wrapper map-floating-control">
			<a onClick={this.menuButtonClick} data-value="true" className={this.state.includeNordic ? 'selected' : ''}>{l('Nordiska sägner')}</a>
			<a onClick={this.menuButtonClick} data-value="false" className={!this.state.includeNordic ? 'selected' : ''}>{l('Svenska sägner')}</a>
		</div>;
	}

}