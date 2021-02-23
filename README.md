# PublikUtforska-GUI
Public crowdsource map based interface

# Start watching code with gulp

```bash
sed -i 's/production = true/production = false/' gulpfile.js && gulp
```

# Bundle code for deployment with gulp, commit and push (be careful to know what you are doing here)

```bash
sed -i 's/production = false/production = true/' gulpfile.js && gulp build && git add www && git commit -m 'fresh compile' && git push origin master
```

# Upgrade node modules

```bash
npm outdated; npm install $(npm outdated | egrep '^[a-z@/-]*' -o | tr '\r\n' ' ') && npm outdated
```