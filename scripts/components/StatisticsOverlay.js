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
                            range: 'transcriptiondate,now-1M/M,now',
                        }}
                        label="avskrivna uppteckningar senaste månaden"
                        visible={this.state.visible}
                        
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
                        />
                    }
                </div>
            </div>
        )
    }
}