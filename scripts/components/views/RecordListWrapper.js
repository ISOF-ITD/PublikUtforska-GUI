import React from 'react';
import RecordList from './RecordList';
import WindowScroll from './../../../ISOF-React-modules/utils/windowScroll'
import routeHelper from './../../../scripts/utils/routeHelper'

export default class RecordListWrapper extends React.Component {
	constructor(props) {
		super(props);

		this.languageChangedHandler = this.languageChangedHandler.bind(this);
	}

	languageChangedHandler() {
		this.forceUpdate();
	}

	componentDidMount() {
		if (window.eventBus) {
			window.eventBus.addEventListener('Lang.setCurrentLang', this.languageChangedHandler)
		}
	}

	componentWillUnmount() {
		if (window.eventBus) {
			window.eventBus.removeEventListener('Lang.setCurrentLang', this.languageChangedHandler)
		}
	}

	render() {
		let _props = this.props;
		return (
			<div className="container">

				<div className="container-header">
					<div className="row">
						<div className="twelve columns">
							<h2>{l('Sökträffar som lista')}</h2>
						</div>
					</div>
				</div>

				<div className="row">
					<div className="records-list-wrapper">
						<RecordList 
							searchParams={routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)}
							highlightRecordsWithMetadataField={this.props.highlightRecordsWithMetadataField}
							{..._props}
						/>
					</div>
				</div>
			</div>
		);
	}
}