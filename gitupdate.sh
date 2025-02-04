echo ------------------------  >> gitupdate.log
date | tee -a gitupdate.log
git status | tee -a gitupdate.log
git log -1 | tee -a gitupdate.log
if [ "$1" != "" ]; then
    echo $1 | tee -a gitupdate.log
    git pull -r$1 | tee -a gitupdate.log
else
    git pull | tee -a gitupdate.log   
fi
git log --oneline | head -n1 | tee -a gitupdate.log
date | tee -a gitupdate.log
whoami | tee -a gitupdate.log

