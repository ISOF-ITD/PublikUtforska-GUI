import React from 'react';
import ReactDOM from 'react-dom';
import noUiSlider from 'nouislider';

// Main CSS: ui-components/slider.less
// Slider CSS: nouislider.min.less

export default class Slider extends React.Component {
	constructor(props) {
		super(props);

		this.sliderChangeHandler = this.sliderChangeHandler.bind(this);
		this.sliderSlideHandler = this.sliderSlideHandler.bind(this);
	}

	componentDidMount() {
		var sliderStart = !isNaN(this.props.start) ? this.props.start : this.props.rangeMin && this.props.rangeMax ? [this.props.rangeMin, this.props.rangeMax] : [0, 10];

		this.slider = noUiSlider.create(this.refs.sliderContainer, {
			start: sliderStart,
			behaviour: this.props.behaviour || 'drag',
			connect: true,
			tooltips: true,
			format: {
				to: function ( value ) {
					return Math.round(value);
				},
				from: function ( value ) {
					return Math.round(value);
				}
			},
			range: !isNaN(this.props.rangeMin) && !isNaN(this.props.rangeMax) && this.props.rangeMin < this.props.rangeMax ? {
				min: this.props.rangeMin,
				max: this.props.rangeMax
			} : {
				min: 0,
				max: 10
			}
		});

		this.slider.on('change', this.sliderChangeHandler)
		this.slider.on('set', this.sliderChangeHandler)
		this.slider.on('slide', this.sliderSlideHandler)
	}

	UNSAFE_componentWillReceiveProps(props) {
		if (props.enabled && props.enabled == true) {
			this.refs.sliderContainer.removeAttribute('disabled');
		}
		else if (props.enabled == false) {
			this.refs.sliderContainer.setAttribute('disabled', true);
		}

		if ((!isNaN(props.rangeMin) && !isNaN(props.rangeMax)) && (props.rangeMin != this.slider.options.range.min || props.rangeMax != this.slider.options.range.max) && props.rangeMin < props.rangeMax) {
			var range = {
				min: Number(props.rangeMin),
				max: Number(props.rangeMax)
			};
			this.slider.updateOptions({
				range: range,
				start: props.start || [range.min, range.max]
			});
		}
	}

	sliderChangeHandler(event) {
		this.value = event;

		if (this.props.onChange) {
			this.props.onChange({
				target: {
					name: this.props.inputName || '',
					type: 'slider',
					value: event
				}
			});
		}
	}

	set(value) {
		this.slider.set(value, false);
	}

	sliderSlideHandler(event) {
		if (this.props.onSlide) {
			this.props.onSlide({
				target: {
					name: this.props.inputName || '',
					type: 'slider',
					value: event
				}
			});
		}
	}

	render() {
		return <div className={'slider-container'+(this.props.className ? ' '+this.props.className : '')}>
			<div ref="sliderContainer"></div>
		</div>;
	}
}