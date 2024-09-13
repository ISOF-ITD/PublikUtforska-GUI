find www -name '*.js' | xargs grep -l 'https://garm.isof.se/folkeservice/' | xargs sed -i.bak 's/https:\/\/garm.isof.se\/folkeservice/http:\/\/localhost:8000\//g'
#find www -name '*.js' | xargs grep -l 'https://garm.isof.se/folkeservice/' | xargs sed -i.bak 's|https://garm.isof.se/folkeservice/|http://localhost:8000/|g'
#sed www/bndl.c23ef7ffa56b703d4212.js 's|https://garm.isof.se/folkeservice/|http://localhost:8000/|g' > www/bndl.c23ef7ffa56b703d4212.js.new

