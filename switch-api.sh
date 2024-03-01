find www -name '*.js' | xargs grep -l 'sagendatabas' | xargs sed -i.bak s/sagendatabas/folkeservice/g
find www -name '*.js' | xargs grep -l 'frigg-test.isof' | xargs sed -i.bak s/frigg-test.isof.se/garm-test.isof.se/g
find www -name '*.js' | xargs grep -l 'frigg.isof' | xargs sed -i.bak s/frigg.isof.se/garm-test.isof.se/g
