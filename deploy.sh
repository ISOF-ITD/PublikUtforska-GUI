#!/bin/bash

# Kör npm-skriptet för att bygga applikationen (bygger till www-deploy)
npm install
npm run build

# Skapa en backup av den nuvarande www-mappen med en tidsstämpel
if [ -d "www" ]; then
  mv www www-backup_$(date +%Y%m%d%H%M%S)
fi

# Byt namn på mappen www-deploy till www
mv www-deploy www

# Hitta alla backup-mappar som matchar mönstret, sortera dem och ta bort de äldsta om det finns fler än 10
backups=( $(ls -d www-backup_* 2>/dev/null | sort) )

if [ ${#backups[@]} -gt 10 ]; then
  removeCount=$((${#backups[@]} - 10))
  echo "Tar bort $removeCount äldsta backup(er)..."
  for ((i=0; i<$removeCount; i++)); do
    echo "Tar bort ${backups[$i]}"
    rm -rf "${backups[$i]}"
  done
fi
