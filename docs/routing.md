# Routing

## Use cases

* State: Most application state is controlled by the route, for example search parameters, search type, and display of one record. This gives normal browser navigation.
* Link sharing: Users can share links to found records, persons, places, or search requests.
* Application links: Links made inside the application must work, for example `records/record_id`.

Some overlay and popup state is not controlled by the route on purpose.

## Examples

```text
/places/recordtype/one_accession_row
```

Search for places, show the map, and filter by record type `one_accession_row` without more search parameters.

```text
/places/search/troll/category/trad3/recordtype/one_record
```

Search for places, show the map, filter by record type `one_record`, category `trad3`, and search word `troll`.

```text
/records/ifgh00707_195393/recordtype/one_accession_row/has_media/true
```

Show record `ifgh00707_195393` while keeping the search parameters `recordtype=one_accession_row` and `has_media=true`.

## Route patterns

In `app.js`, route patterns are matched like this:

```javascript
<Route
  path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/persons/:person_id']}
```

Components can use `routeHelper.js` to create search parameters from the current route. The route is available in `props.match.url`, and the search parameters are passed to components as props.

Example:

```javascript
<CategoryList
  searchParams={routeHelper.createParamsFromSearchRoute(
    props.location.pathname.split(props.match.url)[1],
  )}
/>
```

When the route changes, the search parameter props change too. Then the affected components can update from browser navigation or direct URL changes.

## What is not controlled by routes?

Some states are outside routing, especially events from `eventBus`, popups, overlays, and resize events.
