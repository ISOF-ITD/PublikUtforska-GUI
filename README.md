# Folke sök GUI (Formerly PublikUtforska-GUI)
Public crowdsource map based interface

## Start watching code with gulp

```bash
sed -i 's/production = true/production = false/' gulpfile.js && gulp
```

## Bundle code for deployment with gulp, commit and push (make sure you know what you are doing)

Enter the correct path to the ES-API in config.js (frigg-test or frigg). Otherwise it must be done on the server afterwards. Then run:

```bash
sed -i 's/production = false/production = true/' gulpfile.js && gulp build && git add www && git commit -m 'fresh compile' && git push origin master
```

Deploy code on server:

```bash
cd /var/www/react/PublikUtforska-GUI/www && ./svn_www_update.sh 
# i testmiljön:
sh switch-prod-2-test.sh
```

## Upgrade node modules

```bash
npm outdated; npm install $(npm outdated | egrep '^[a-z@/-]*' -o | tr '\r\n' ' ') && npm outdated
```

## Import new data

See README.md in TradarkAdmin: https://vcs.its.uu.se/isof-devs/TradarkAdmin/src/master/README.md

## Set up ssh by following github instructions

### Example:
https://docs.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account

# Documentation

## Routing

The entire state of the application (with some exceptions such as the display of overlays) is controlled by the route: E.g. search parameters, type of search, display of a single record.

Some examples:

`/places/recordtype/one_accession_row`

=> search for places (=display the map), filtered by record type 'One Accession row' without further search parameters

`/places/search/troll/category/trad3/recordtype/one_record`

=> search for places (=display the map) filtered by record type 'One record', filtered by category 'trad3' and the search term 'troll'.

`/records/ifgh00707_195393/recordtype/one_accession_row/has_media/true`

=> show record 'ifgh00707_195393' while the search is still set to parameters *recordtype=one_accesion_row* and *has_media=true*.

In app.js, we specify which route patterns can be matched:

```javascript
// app.js
<Route 
    path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/person/:person_id']}
```

In each component, the *routeHelper* (see routeHelper.js) can derive the search parameters from the route (which is accessible in `props.match.url`), so that the search parameters are available inside the component with `this.props.searchParams`.

Example:

```javascript
// SearchBox.js
// derive search params from the current route and send them to <CategoryList/> as props:
<CategoryList
    searchParams={routeHelper.createParamsFromSearchRoute(props.location.pathname.split(props.match.url)[1])}
	/>
```

Since, in the above example, the searchParams are a part of the component's **props**, changes will be passed down, i.e. changing them will also trigger (if necessary) a change in the component. This means that changes in the route (by clicking or directly changing the address line) can directly affect all components.

### What is not controlled by the routes?

Some states of the application are not in the scope of the routing. This affects all events that are triggered by eventBus, especially popups, overlays and `resize` events.
