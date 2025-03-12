# Folke sök GUI (aka PublikUtforska-GUI)
Public crowdsource map based interface

[Accessibility](Accessibility.md)

## Code style and conventions

* Use [ES6](http://es6-features.org/) syntax.
* Use [React](https://reactjs.org/) [functional components](https://react.dev/learn/your-first-component) with [hooks](https://reactjs.org/docs/hooks-intro.html) rather than class components. When making changes to an existing class component, consider [refactoring it to a functional component](https://react.dev/reference/react/Component#alternatives). Make use of [generative AI tools](https://chat.openai.com/share/1574d01c-0b6e-43e3-82a4-a0de8d5ac955) to help you with the refactoring.
* Use [PropTypes](https://reactjs.org/docs/typechecking-with-proptypes.html) to document the props of a component.
* Use [Airbnb's JavaScript Style Guide](https://github.com/airbnb/javascript) with [ESLint](https://eslint.org/).

## Development with Visual Studio Code

Recommended extensions:

* Code style: We use [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to enforce a consistent code style. The rules are defined in [.eslintrc.js](.eslintrc.js) and are based on [Airbnb's JavaScript Style Guide](https://github.com/airbnb/javascript). With ESLint you 
get code style warnings and errors while you type. You can run "Fix all auto-fixable Problems" (`Ctrl+Shift+P`) to fix most of the code style issues
* (optional) [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode): with Prettier you can run "Format Document" (`Shift+Alt+F`) to format the code

## Start watching code with webpack

```bash
npm run start
```

## Analyze bundle sizes

```bash
npm run analyze-bundle
```

## Deploy code on server

Run on server:

```bash
cd /var/www/react/PublikUtforska-GUI/
# We have not integrated gitupdate.sh in deploy.sh yet
# to be able to deploy an older version.
./gitupdate.sh
./deploy.sh
```

## Create or update sitemap

Run on server:

```bash
npm run create-sitemap
```
## Automated Sitemap Updates via Cron on garm

A cron job on the production server garm runs the sitemap generation script every Monday at 04:00 AM:

```bash	
cd /var/www/react/PublikUtforska-GUI/ && npm run create-sitemap | awk '{print strftime("[%Y-%m-%d %H:%M:%S]"), $0}' >> /var/www/react/PublikUtforska-GUI/logs/sitemap.log 2>> >(awk '{print strftime("[%Y-%m-%d %H:%M:%S]"), $0}' >> /var/www/react/PublikUtforska-GUI/logs/sitemap-error.log)

```

This command changes to the project directory, runs the create-sitemap script, and logs output and errors separately.

You can check the logs in the `logs` directory of the project. You can change the cron job by running `crontab -e` and editing the cron jobs.

## Import new data

See README.md in TradarkAdmin: https://vcs.its.uu.se/isof-devs/TradarkAdmin/src/master/README.md

# Documentation

## How to display a warning message, e.g., when the server is slow

To add a custom warning message to the application, follow these steps:

1. **Create the `varning.html` file on the server**:
   - Add a file named `varning.html` to the `www` folder of your project. 
   - This file should contain the HTML structure of the warning message. You can include plain text or HTML tags (e.g., `<pre>`, `<strong>`, etc.) to style the message as needed.
   
2. **Display the warning message**:
   - If the `varning.html` file exists, the warning message will be automatically rendered.

## Managing Robots.txt with Apache Proxy

To manage different `robots.txt` files for different environments (test or production), an Apache proxy configuration is used. This setup ensures that search engines do not index the test environment while allowing proper indexing of the production environment, following the rules specified in `/robots/robots.production.txt`.

### Apache Configuration

#### Test Environment (garm-test)

In the test environment, the proxy is configured to serve robots.test.txt:

```apache
Alias /robots.txt /var/www/react/PublikUtforska-GUI/robots/robots.test.txt

<Directory "/var/www/react/PublikUtforska-GUI/config">
    Require all granted
</Directory>
```

#### Production Environment (garm)

In the production environment, the proxy serves `robots.production.txt`:

```apache
Alias /robots.txt /var/www/react/PublikUtforska-GUI/robots/robots.production.txt

<Directory "/var/www/react/PublikUtforska-GUI/config">
    Require all granted
</Directory>
```

This configuration ensures that the appropriate robots.txt file is used depending on the environment.

### Updating robots.txt

If modifications to `robots.txt` are required, update the corresponding file in the `/robots/` directory and verify that the proxy correctly points to the intended version. 



## css 
Uses less. Every component states its main css in a comment 
Example:
// Main CSS: ui-components/audio-player.less

## Components
Types:
- scripts\components\collections
- scripts\components\views
- scripts\components\

### Props

### PropTypes
See "Code style and conventions" and
https://react.dev/reference/react/Component#static-proptypes

```javascript
import PropTypes from 'prop-types';
```

### State

State as individual state-values or array
Anything to think about???

Example State as individual state-values in FeedbackOverlay:
```javascript
const [visible, setVisible] = useState(false);
const [messageInputValue, setMessageInputValue] = useState('');
  
..
setVisible(false);
```

Example State as array in TranscriptionHelpOverlay:
```javascript
const [state, setState] = useState({
visible: false,
messageInputValue: '',
nameInputValue: '',
emailInputValue: '',
messageSent: false,
});
..
setState((prevState) => ({ ...prevState, visible: false }));
```

## Routing

### Use cases

* **State**: The entire state of the application (with some exceptions such as the display of overlays) is controlled by the route: E.g. search parameters, type of search, display of a single record. Enables working browser navigation.
* **Link sharing**:
    * Users can share links to found records, persons, places or search requests.
    * Sharable links from within application must work. (`records/record_id`).
    * Maybe in the future: Add sharable links for places (`places/place_id`) and persons (`person/person_id`)

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
    path={['/places/:place_id([0-9]+)?', '/records/:record_id', '/persons/:person_id']}
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

## EventBus

TODO
