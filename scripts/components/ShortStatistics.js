import React, { useState, useEffect } from "react";
import { animated, useSpring } from "@react-spring/web";
import _ from "lodash";
import config from "../config.js";

export default function ShortStatistics(props) {
    const [value, setValue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const animatedValue = useSpring({
        from: { number: 0 },
        number: value,
        config: { duration: 1000 },
    });

    const fetchStatistics = () => {
        let paramStrings = [];
        let queryParams = _.defaults(props.params, config.requiredParams);

        for (var key in queryParams) {
            if (queryParams[key]) {
                paramStrings.push(key + "=" + queryParams[key]);
            }
        }

        let paramString = paramStrings.join("&");

        fetch(config.apiUrl + "count?" + paramString)
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Fel vid hämtning av statistik");
                }
            })
            .then((json) => {
                setValue(json.data.value);
                setLoading(false);
                setError(false);
            })
            .catch((error) => {
                setLoading(false);
                setError(true);
            });
    };

    // when the prop "visible" changes to true changes to true
    // fetch the number of records that matches the search params
    useEffect(() => {
        if (props.visible) {
            fetchStatistics();
           
            const timer = setInterval(() => {
                fetchStatistics();
            }, 60000);
            return () => clearInterval(timer);
        }

    }, [props.visible]);

    return (
        <div className="short-statistics">
            {!value && loading && <div className="loading">Hämtar statistik...</div>}
            {error && <div className="error">Fel vid hämtning av statistik</div>}
            {!loading && !error && props.visible && (
                // use react-spring to animate the value

                <animated.div className="value">
                    {animatedValue.number.interpolate(num => Math.floor(num))}
                </animated.div>

            )}
            {!loading && !error && <div className="label">{props.label}</div>}
        </div>
    );
}