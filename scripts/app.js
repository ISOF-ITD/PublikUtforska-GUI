import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Redirect } from 'react-router-dom'

import Application from './components/Application';
import RecordListWrapper from './components/views/RecordListWrapper';

import routeHelper from './utils/routeHelper'

console.log(`PublikUtforska running React.js version ${React.version} and ReactDOM version ${ReactDOM.version}`);

/*
Object.assign polyfill
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
*/
// For older browsers that has no Object.assign defined:
if (typeof Object.assign != 'function') {
	// Must be writable: true, enumerable: false, configurable: true
	Object.defineProperty(Object, "assign", {
		value: function assign(target, varArgs) { // .length of function is 2
			'use strict';
			if (target == null) { // TypeError if undefined or null
				throw new TypeError('Cannot convert undefined or null to object');
			}

			var to = Object(target);

			for (var index = 1; index < arguments.length; index++) {
				var nextSource = arguments[index];

				if (nextSource != null) { // Skip over if undefined or null
					for (var nextKey in nextSource) {
						// Avoid bugs when hasOwnProperty is shadowed
						if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
							to[nextKey] = nextSource[nextKey];
						}
					}
				}
			}
			return to;
		},
		writable: true,
		configurable: true
	});
}

// IE 11 backwards compatibility, Promise och Fetch
import 'whatwg-fetch';
import Promise from 'promise-polyfill';

if (!window.Promise) {
	window.Promise = Promise;
}

// Initalisera stöd för flerspråkighet
import Lang from './../ISOF-React-modules/lang/Lang';
// Språk: svenska
Lang.setCurrentLang('sv');
window.Lang = Lang;
window.l = Lang.get;

// Initalisera React.js Router som bestämmer vilken "sida" användaren ser baserad på url:et 
// "component" pekar mot importerade componenter (se högst uppe i denna fil)
ReactDOM.render(

	<HashRouter>
		<Route exact path="/">
			<Redirect to="/places/recordtype/one_accession_row/has_media/true" />
		</Route>
		<Route exact path="/places">
			<Redirect to="/places/recordtype/one_accession_row/has_media/true" />
		</Route>
		<Route
			path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/person/:person_id']}
			render={(props) =>
				<Application
					popup={<RecordListWrapper
						manuallyOpenPopup={true}
						openButtonLabel="Visa sökträffar som lista"
						disableRouterPagination={true}
						searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
						{...props}
						/>}
					{...props}
				/>
			}
		/>

	</HashRouter>,
	document.getElementById('app')

);