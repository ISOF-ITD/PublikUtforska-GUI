import React from 'react';
import routeHelper from './../utils/routeHelper'

export default class FilterSwitch extends React.Component {
	constructor(props) {
		super(props);
		this.menuButtonClick = this.menuButtonClick.bind(this);
		this.openSwitcherHelptext = this.openSwitcherHelptext.bind(this);
	}

	openSwitcherHelptext() {
		if (window.eventBus) {
			window.eventBus.dispatch('overlay.switcherHelpText', {
			});
		}
	}

	menuButtonClick(event) {
		const value = event.currentTarget.dataset.value;
		const params = {...this.props.searchParams};
		params['recordtype'] = value;
		// 
		if (value === 'one_accession_row') {
			params['category'] = undefined;
			params['transcriptionstatus'] = undefined;
			// default is digitized material 
			params['has_media'] = true;
		} else if (value === 'one_record') {
			params['has_media'] = undefined;
		}
		this.props.history.push(
			'/places'
			+ routeHelper.createSearchRoute(params)
			);
	}

	render() {
		return <div className="nordic-switch-wrapper map-floating-control">
			<a onClick={this.menuButtonClick} data-value="one_accession_row" className={this.props.searchParams.recordtype == 'one_accession_row' ? 'selected' : ''}>{l('Accession')}</a>
			<a onClick={this.menuButtonClick} data-value="one_record" className={this.props.searchParams.recordtype == 'one_record' ? 'selected' : ''}>{l('Uppteckning')}</a>
			<span className='switcher-help-button' onClick={this.openSwitcherHelptext} title='Om accessioner och uppteckningar'>?</span>
		</div>;
	}

}