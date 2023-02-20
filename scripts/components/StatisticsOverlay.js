import React, { useState, useEffect } from "react";
import RecordList from "./views/RecordList.js";
import routeHelper from "../utils/routeHelper.js";

import ShortStatistics from "./ShortStatistics.js";

export default function StatisticsOverlay(props) {

    const [visible, setVisible] = useState(false);
    const [hasBeenVisible, setHasBeenVisible] = useState(false);
    const params = {
        size: 10,
        recordtype: 'one_record',
        transcriptionstatus: 'published',
        sort: 'transcriptiondate', //'approvedate',
        order: 'desc',
    };

    useEffect(() => {
        // listen for the event that is dispatched when the user clicks the hamburger menu button
        window.eventBus.addEventListener('overlay.sideMenu', function (event, data) {
            if (event.target === 'visible') {
                setVisible(true);
                setHasBeenVisible(true);
            }
        });
    }, []);

    return (
        <div className={`statistics-overlay ${visible ? 'visible' : ''}`}>
            <div className="container-header">
                <a className="close-button white" onClick={() => setVisible(false)}></a>
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
                    visible={visible}
                    applicationInFocus={props.applicationInFocus}

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
                    visible={visible}
                    applicationInFocus={props.applicationInFocus}

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
                    visible={visible}
                    applicationInFocus={props.applicationInFocus}
                />

                <h3>Senast avskrivna uppteckningar</h3>
                {/* get the records, when state visible is set to true and the component has not been visible before */}
                {(visible || hasBeenVisible) &&
                    <RecordList
                        key={`latest-RecordList`}
                        disableRouterPagination={true}
                        searchParams={params}
                        disableListPagination={true}
                        columns={['title', 'year', 'place', 'transcribedby']}
                        // create siteSearchParams in order to
                        // keep the global search params when navigating to a record
                        siteSearchParams={routeHelper.createParamsFromPlacesRoute(props.location.pathname)}
                        class="table-compressed"
                        // möjliggör att visa 50 poster efter en klick på "visa fler"
                        sizeMore={50}
                        // interval is 60 sec, if visible is true and the web browser is in focus
                        interval={props.applicationInFocus && visible && 60000}
                    />
                }
            </div>
        </div>
    );
}