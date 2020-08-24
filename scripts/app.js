import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Redirect } from 'react-router-dom'

import Application from './components/Application';
import RecordListWrapper from './../ISOF-React-modules/components/views/RecordListWrapper';
import PersonView from './../ISOF-React-modules/components/views/PersonView';

console.log(`PublikUtforska running React.js version ${React.version} and ReactDOM version ${ReactDOM.version}`);

/*
Object.assign polyfill
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
*/
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
			<Redirect to="/places" />
		</Route>
		<Route 
			path={[
				//"/places/text_ids/:text_ids",

				// Saved records by user
				"/places/record_ids/:record_ids/(filter)?/:filter?",

				//"/places/search/:search?/category/:category,:subcategory/(has_metadata)?/:has_metadata?",
				//"/places/search/:search/category/:category/(has_metadata)?/:has_metadata?",
				//"/places/search/:search/(has_metadata)?/:has_metadata?",
				"/places/search/:search/category/:category/(filter)?/:filter?",
				"/places/search/:search/search_field/:search_field/category/:category/(filter)?/:filter?",
				"/places/search/:search/search_field/:search_field/(filter)?/:filter?",
				"/places/search/:search/(filter)?/:filter?",
				
				"/places/search_field/:search_field",

				//"/places/:place_id/category/:category,:subcategory/(has_metadata)?/:has_metadata?",
				//"/places/:place_id/category/:category/(has_metadata)?/:has_metadata?",
				//"/places/category/:category,:subcategory/(has_metadata)?/:has_metadata?",
				//"/places/category/:category/(has_metadata)?/:has_metadata?",
				//"/places/:place_id/search/:search/category/:category,:subcategory/(has_metadata)?/:has_metadata?",
				//"/places/:place_id/search/:search/category/:category/(has_metadata)?/:has_metadata?",
				//"/places/:place_id/search/:search/(has_metadata)?/:has_metadata?",
				//"/places/:place_id/(has_metadata)?/:has_metadata?",

				"/places/:place_id([0-9]+)/category/:category/(filter)?/:filter?",
				"/places/category/:category/(filter)?/:filter?",
				"/places/:place_id([0-9]+)/(filter)?/:filter?",
				"/places/:place_id([0-9]+)/search/:search/category/:category/(filter)?/:filter?",
				"/places/:place_id([0-9]+)/search/:search/(filter)?/:filter?",

				"/places/(filter)?/:filter?", // this has to be the last item in order to match the other routes, 
				//"/places/(has_metadata)?/:has_metadata?", // this has to be the last item in order to match the other routes, 
				// otherwise it will match longer paths as well

				"/records/:person_id/text_ids/:text_ids/(filter)?/:filter?",
				//"/records/:record_id/search/:search/category/:category,:subcategory/(filter)?/:filter?",
				"/records/:record_id/search/:search/category/:category/(filter)?/:filter?",
				"/records/:record_id/search/:search/(filter)?/:filter?",
				"/records/:record_id/search_field/:search_field/(filter)?/:filter?",
				//"/records/:record_id/category/:category,:subcategory/(filter)?/:filter?",
				"/records/:record_id/category/:category/(filter)?/:filter?",
				"/records/:record_id/(filter)?/:filter?",

				"/person/:person_id/(filter)?/:filter?",

			]}
			render={(props) =>
				<Application
					popup={<RecordListWrapper 
						{...props} 
						manuallyOpenPopup={true}
						//highlightRecordsWithMetadataField="sitevision_url" 
						openButtonLabel="Visa sökträffar som lista"
						disableRouterPagination={true}
						/>}
					{...props}	
				/>
			}
		/>

	</HashRouter>,
	document.getElementById('app')


// Old:
//			<Route path="/places(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)(/page/:page)" 
//				manuallyOpenPopup="true" openButtonLabel="Visa sökträffar som lista" components={{popup: RecordListWrapper}}/>

//			<Route path="/place/:place_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)" 
//				components={{popup: PlaceView}}/>

//			<Route path="/person/:person_id" 
//				components={{popup: PersonView}}/>

//			<Route path="/records/:record_id(/record_ids/:record_ids)(/search/:search)(/search_field/:search_field)(/type/:type)(/category/:category)(/year_from/:year_from)(/year_to/:year_to)(/person_relation/:person_relation)(/gender/:gender)(/person_landskap/:person_landskap)(/person_county/:person_county)(/person_harad/:person_harad)(/person_socken/:person_socken)(/filter/:filter)" 
//				components={{popup: RecordView}}/>


);