# PublikUtforska-GUI
Public crowdsource map based interface

# Start watching code with gulp

```bash
sed -i 's/production = true/production = false/' gulpfile.js && gulp
```

# Bundle code for deployment with gulp, commit and push (be careful to know what you are doing here)

Enter the correct path to the ES-API in config.js (frigg-test or frigg). Otherwise it must be done on the server afterwards. Then run:

```bash
sed -i 's/production = false/production = true/' gulpfile.js && gulp build && git add www && git commit -m 'fresh compile' && git push origin master
```

Deploy code on server:

```bash
cd /var/www/django/static/js-apps/publikutforska && ./svn_www_update.sh && exit
```

# Upgrade node modules

```bash
npm outdated; npm install $(npm outdated | egrep '^[a-z@/-]*' -o | tr '\r\n' ' ') && npm outdated
```

# Import new data

See README.md in TradarkAdmin: https://vcs.its.uu.se/isof-devs/TradarkAdmin/src/master/README.md