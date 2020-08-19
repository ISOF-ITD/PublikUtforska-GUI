import React from 'react';
import ReactDOM from 'react-dom';

export default class TranscriptionStatusSwitch extends React.Component {
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
			filter: event.target.filter == 'true'
		});
	}

	menuButtonClick(event) {
		const value = event.currentTarget.dataset.value == 'true';
		this.setState({
			filter: value
		}, function() {
			this.props.history.push('/places'+(this.state.selectedCategory ? '/category/'+this.state.selectedCategory : '')+(this.state.filter ? '/filter/true' : ''));
			if (window.eventBus) {
				window.eventBus.dispatch('nordicLegendsUpdate', null, {searchMetadata: this.state.searchMetadata});
			}
			console.log('function' + this.state.filter);
		}.bind(this));
	}

	render() {
		return <div className="nordic-switch-wrapper map-floating-control">
			<a onClick={this.menuButtonClick} data-value="false" className={this.state.filter == false ? 'selected' : ''}>{l('Allt material')}</a>
			<a onClick={this.menuButtonClick} data-value="true" className={this.state.filter == true ? 'selected' : ''}>{l('För transkribering')}</a>
		</div>;
	}

}