find . -name 'app.js' | xargs grep -l 'disableInformantLinks:!0,' | xargs sed -i.bak 's;disableInformantLinks:!0,;;g'
