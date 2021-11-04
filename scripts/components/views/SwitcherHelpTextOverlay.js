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
                <p>Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut.</p>
				<p><strong>Accessioner:</strong> Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.</p>
				<p><strong>Uppteckningar:</strong> Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, </p>
				<p>
                    <a href="https://www.isof.se/folkminnen/beratta-for-oss.html"><strong>{l('Läs mer.')}</strong></a>
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