import React from "react";
import config from './../config.js';
import RecordsCollection from "./../../ISOF-React-modules/components/collections/RecordsCollection.js";

export default class StatisticsOverlay extends React.Component {

    constructor() {
        super();
        this.state = {
            fiveLatestRecords: [],
            fetching: false,
            visible: false,
        }

        this.collections = new RecordsCollection(function (json) {
            this.setState({
                fiveLatestRecords: json.data
            });
        }.bind(this));
    }
    // on mount, get the five latest records from elastic search
    componentDidMount() {
        this.fetchFiveLatestRecords();

        // listen for the event that is dispatched when the user clicks the hamburger menu button
        window.eventBus.addEventListener('overlay.sideMenu', function (event, data) {
            if (event.target === 'visible') {
                this.fetchFiveLatestRecords();
                this.setState({
                    visible: true
                });
            }
        }.bind(this));
    }

    fetchFiveLatestRecords() {
        this.setState({
            fetching: true
        });

        const fetchParams = {
            size: 5,
            recordtype: 'one_record',
            transcriptionstatus: 'published',
        };

        this.collections.fetch(fetchParams);
    }

    render() {
        return (
            <div className="statistics-overlay" style={this.state.visible ? { display: 'block' } : {}}>
                <div className="container-header">
                    <a className="close-button white" onClick={function () {
                        this.setState({
                            visible: false
                        });
                    }.bind(this)}>
                    </a>

                    {/* <h1>Statistics</h1> */}
                    <h2>Upptäck</h2>
                </div>
                <div className="row">
                    <h3>Senast avskrivna uppteckningar</h3>
                    <ul>
                        {this.state.fiveLatestRecords.map(function (record, index) {
                            return (
                                <a href={'#/records/' + record._source.id} key={index}>
                                    <li>{record._source.title}</li>
                                </a>
                            )
                        }
                        )}
                    </ul>
                </div>
            </div>
        )
    }
}