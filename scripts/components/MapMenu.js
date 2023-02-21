import React from 'react';
import { Route } from 'react-router-dom';
import routeHelper from './../utils/routeHelper'
import SearchBox from './SearchBox';
import FilterSwitch from './FilterSwitch';

export default function MapMenu(props) {
  const searchParams = (pathname) => {
    return routeHelper.createParamsFromSearchRoute(pathname.split(props.match.url)[1]);
  };

  return (
    <Route path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/person/:person_id']}>
      {(routeProps) => (
        <div className={`menu-wrapper${props.expanded ? ' menu-expanded' : ''}`}>
          <FilterSwitch {...routeProps} searchParams={searchParams(routeProps.location.pathname)} />
          <SearchBox
		  	{...routeProps}
			// the search field value does not update when the route changes
			// so we need to force it to update with the key prop
			key={routeProps.location.pathname}
			searchParams={searchParams(routeProps.location.pathname)}
			expanded={props.expanded} />
        </div>
      )}
    </Route>
  );
}