import React from 'react';
import ReactDOM from 'react-dom';

export default class FilterSwitch extends React.Component {
	constructor(props) {
		super(props);

		this.menuButtonClick = this.menuButtonClick.bind(this);

		if (window.eventBus) {
			window.eventBus.addEventListener('application.searchParams', this.receivedSearchParams.bind(this))
		}

		//console.log('window.applicationSettings.includeNordic:' + window.applicationSettings.includeNordic)
		this.state = {
			filter: false,
			selectedCategory: null
		};
	}

	receivedSearchParams(event) {
		//debugger;
		this.setState({
			selectedCategory: event.target.selectedCategory,
			filter: event.target.filter
		});
	}

	menuButtonClick(event) {
		const value = event.currentTarget.dataset.value == 'true';
		this.setState({
			filter: value
		}, function() {
			this.props.history.push(
					'/places'
					+(this.props.searchParams.search ? '/search/'+this.props.searchParams.search : '')
					+(this.props.searchParams.search_field ? '/search_field/'+this.props.searchParams.search_field : '')
					+(this.state.selectedCategory ? '/category/'+this.state.selectedCategory : '')
					+(this.state.filter ? '/filter/true' : '')

				);
			if (window.eventBus) {
				window.eventBus.dispatch('nordicLegendsUpdate', null, {searchMetadata: this.state.searchMetadata});
			}
			console.log('FilterSwitch.menuButtonClick function: this.state.filter' + this.state.filter);
		}.bind(this));
	}

	render() {
		return <div className="nordic-switch-wrapper map-floating-control">
			<a onClick={this.menuButtonClick} data-value="false" className={this.state.filter ? '' : 'selected'}>{l('Allt material')}</a>
			<a onClick={this.menuButtonClick} data-value="true" className={this.state.filter ? 'selected' : ''}>{l('För avskrift')}</a>
		</div>;
	}

}