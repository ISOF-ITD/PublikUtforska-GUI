import React from 'react';
import config from './../../../scripts/config.js';

export default class SwitcherHelpTextOverlay extends React.Component {
	constructor(props) {
		//console.log('ContributeinfoOverlay');
		//debugger;
		super(props);

		this.closeButtonClickHandler = this.closeButtonClickHandler.bind(this);

		this.state = {
			visible: false,
		};

		if (window.eventBus) {
			window.eventBus.addEventListener('overlay.switcherHelpText', function(event) {
				this.setState({
					visible: true,
					title: 'Title',
				});
			}.bind(this));
			window.eventBus.addEventListener('overlay.hide', function(event) {
				this.setState({
					visible: false
				});
			}.bind(this));
		}
	}

	closeButtonClickHandler() {
		this.setState({
			visible: false,
		});
	}

	render() {
			var overlayContent = <div>
                <p>Ord som förekommer ofta i Folke utforska är accession och uppteckning. Här förklarar vi tydligare vad orden innebär.</p>
				<p><strong>Vad är en accession?</strong><br/>En accession är en del av en arkivserie och varje accession har ett unikt accessionsnummer. En accession rör oftast en särskild geografisk plats, till exempel en socken, men kan innehålla flera uppteckningar med olika ämnen och olika berättare. Accessionerna är sökbara på alla sina uppteckningars titlar, orter och insamlare.<br/>Om du vill ha ett helhetsgrepp över ett insamlat material på en viss ort, ett visst ämne eller en särskild insamlare är det accessionerna du ska söka i.</p>
				<p><strong>Vad är en uppteckning?</strong><br></br>En uppteckning kan beskrivas som ett samlingsbegrepp för olika sorters material. Här är en uppteckning ofta en unik berättelse i en accession, där accessionen i sig består av ett flertal uppteckningar. En uppteckning handlar oftast om ett specifikt ämne. <br></br> Det är på uppteckningsnivån i kartan som du kan söka efter berättelser att transkribera/skriva av och på så sätt göra mer tillgängliga för andra.</p>
				<p>
                    <a href="https://www.isof.se/arkiv-och-insamling/digitala-arkivtjanster/folke/instruktioner-och-sokhjalp"><strong>{l('Läs mer.')}</strong></a>
				</p>
			</div>;

		return <div className={'overlay-container feedback-overlay-container'+(this.state.visible ? ' visible' : '')}>
			<div className="overlay-window">
				
				<div className="overlay-header">
					{l('Accessioner och uppteckningar')}
					<button title="stäng" className="close-button white" onClick={this.closeButtonClickHandler}></button>
				</div>

				{overlayContent}

			</div>
		</div>;
	}
}
