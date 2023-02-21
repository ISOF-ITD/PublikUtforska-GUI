import React from 'react';
import ReactDOM from 'react-dom';
import Client from 'react-dom/client';
import { HashRouter, Router } from 'react-router-dom';

import ApplicationWrapper from './components/ApplicationWrapper';

import { ENV } from './config'

import './../less/style-basic.less';

if (ENV !== "prod") {
	console.log(`PublikUtforska running React.js version ${React.version} and ReactDOM version ${ReactDOM.version} on ${ENV} environment`);
} 

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
const container = document.getElementById('app');
const root = Client.createRoot(container);


root.render(
	<HashRouter>
		<ApplicationWrapper />
	</HashRouter>
);