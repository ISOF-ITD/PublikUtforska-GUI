import React from "react";
import RecordList from "./views/RecordList.js";
import routeHelper from "../utils/routeHelper.js";

import ShortStatistics from "./ShortStatistics.js";

export default class StatisticsOverlay extends React.Component {

    constructor() {
        super();
        this.state = {
            visible: false,
            hasBeenVisible: false,
        }

        this.params = {
            size: 10,
            recordtype: 'one_record',
            transcriptionstatus: 'published',
            sort: 'transcriptiondate', //'approvedate',
            order: 'desc',
        };

    }
    // on mount, get the five latest records from elastic search
    componentDidMount() {
        // listen for the event that is dispatched when the user clicks the hamburger menu button
        window.eventBus.addEventListener('overlay.sideMenu', function (event, data) {
            if (event.target === 'visible') {
                this.setState({
                    visible: true,
                    hasBeenVisible: true,
                });
            }
        }.bind(this));
    }

    render() {
        return (
            <div className={`statistics-overlay ${this.state.visible ? 'visible' : ''}`}>
                <div className="container-header">
                    <a className="close-button white" onClick={function () {
                        // dispatch an event that will close the overlay
                        this.setState({
                            visible: false
                        });
                    }.bind(this)}>
                    </a>

                    <h2>Upptäck</h2>
                </div>
                <div className="row">
                    {/* Show how many records that have been transcribed the last month */}
                    <ShortStatistics
                        params={{
                            recordtype: 'one_record',
                            transcriptionstatus: 'published',
                            // +2h to account for the time difference between the server and the timestamps in the database
                            range: 'transcriptiondate,now-1M/M,now%2B2h',
                        }}
                        label="avskrivna uppteckningar senaste månaden"
                        visible={this.state.visible}
                        applicationInFocus={this.props.applicationInFocus}
                        
                    />

                    {/* Show how many pages that have been transcribed the last month */}
                    <ShortStatistics
                        params={{
                            recordtype: 'one_record',
                            transcriptionstatus: 'published',
                            // +2h to account for the time difference between the server and the timestamps in the database
                            // urlencode the range parameter. range = 'transcriptiondate,now-1M/M,now+2h'
                            range: 'transcriptiondate,now-1M/M,now%2B2h',
                            aggregation: 'sum,archive.total_pages',
                        }}
                        label="avskrivna sidor senaste månaden"
                        visible={this.state.visible}
                        applicationInFocus={this.props.applicationInFocus}
                        
                    />

                    {/* Show how many different users have transcribed in the last month */}
                    <ShortStatistics
                        params={{
                            recordtype: 'one_record',
                            transcriptionstatus: 'published',
                            // +2h to account for the time difference between the server and the timestamps in the database
                            range: 'transcriptiondate,now-1M/M,now%2B2h',
                            aggregation: 'cardinality,transcribedby.keyword',
                        }}
                        label="användare som har skrivit av uppteckningar senaste månaden"
                        visible={this.state.visible}
                        applicationInFocus={this.props.applicationInFocus}
                    />

                    <h3>Senast avskrivna uppteckningar</h3>
                    {/* get the records, when state visible is set to true and the component has not been visible before */}
                    {(this.state.visible || this.state.hasBeenVisible) &&
                        <RecordList 
                            key={`latest-RecordList`}
                            disableRouterPagination={true}
                            searchParams={this.params}
                            disableListPagination={true}
                            columns={['title', 'year', 'place', 'transcribedby']}
                            // create siteSearchParams from the current route in order to
                            // keep the global search params when navigating to a record
                            siteSearchParams={routeHelper.createParamsFromPlacesRoute(this.props.location.pathname)}
                            class="table-compressed"
                            // möjliggör att visa 50 poster efter en klick på "visa fler"
                            sizeMore={50}
                            // interval is 10000, if this.state.visible is true and the web browser is in focus
                            interval={this.props.applicationInFocus && this.state.visible && 10000}
                            // interval={this.state.visible && 10000}
                        />
                    }
                </div>
            </div>
        )
    }
}