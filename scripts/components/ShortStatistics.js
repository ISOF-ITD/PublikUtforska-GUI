// create a new React component that
// - shows a "value"-div with the value from the state
// - underneath, it shows a text that is passed as a prop called "label"
// - fetches the number of records that matches the search params on mount
// - updates the value in the label when the API returns the number of records
// - shows a loading indicator while the API is fetching the number of records
// - shows an error message if the API returns an error

// Path: scripts\components\ShortStatistics.js

import React from "react";
import config from "../config.js";
import _ from "underscore";

import { Spring, animated } from '@react-spring/web';

export default class ShortStatistics extends React.Component {
    
        constructor() {
            super();
            this.state = {
                value: null,
                loading: true,
                error: false,
            }
        }

        fetchStatistics() {
            let paramStrings = [];
            let queryParams = _.defaults(this.props.params, config.requiredParams);

            for (var key in queryParams) {
                if(queryParams[key]) {
                    paramStrings.push(key + '=' + queryParams[key]);
                }
            }

            let paramString = paramStrings.join('&');

            fetch(config.apiUrl + 'count?' + paramString)
                .then((response) => {
                    if (response.ok) {
                        return response.json();
                    }
                    else {
                        throw new Error('Fel vid hämtning av statistik');
                    }
                })
                .then((json) => {
                    this.setState({
                        value: json.data.value,
                        loading: false,
                        error: false,
                    });
                })
                .catch((error) => {
                    this.setState({
                        loading: false,
                        error: true,
                    });
                });
        }
    
        componentDidMount() {
            // fetch the number of records that matches the search params
            this.fetchStatistics();

            const observer = new IntersectionObserver((entries) => {
                this.handleVisibilityChange(entries[0].isIntersecting);
            }, { threshold: 0.5 });

            if (this.ref) {
                observer.observe(this.ref);
            }
        }
    
    render() {

        return (
            <div className="short-statistics" ref={ref => (this.ref = ref)}>
                {this.state.loading &&
                    <div className="loading">Hämtar statistik...</div>
                }
                {this.state.error &&
                    <div className="error">Fel vid hämtning av statistik</div>
                }
                {!this.state.loading && !this.state.error &&
                    // use react-spring to animate the value
                    <Spring
                        from={{ x: 0 }}
                        to={{ x: this.state.value + 100 }}
                        config={{ duration: 1000 }}
                    >
                        {props => {
                            return <animated.div className="value">{props.x.interpolate(val => Math.floor(val))}</animated.div>;
                        }}
                    </Spring>
                }
                {
                    !this.state.loading && !this.state.error &&
                    <div className="label">{this.props.label}</div>
                }
            </div>
        )
    }
    }