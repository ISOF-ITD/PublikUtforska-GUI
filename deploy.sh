#!/bin/bash

# Standardvärde för PUBLIC_PATH
PUBLIC_PATH=""

# Kolla om en flagga --publicPath är angiven
while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
    --publicPath)
      PUBLIC_PATH="$2"
      shift # hoppa över värdet
      shift # hoppa över flaggan
      ;;
    *)
      shift # ignorera okända flaggor
      ;;
  esac
done

# Lägg till en / på slutet om den saknas
if [[ -n "$PUBLIC_PATH" && "${PUBLIC_PATH: -1}" != "/" ]]; then
  PUBLIC_PATH="${PUBLIC_PATH}/"

# Installera beroenden
npm install

# Bygg applikationen med eller utan PUBLIC_PATH
if [ -n "$PUBLIC_PATH" ]; then
  echo "Bygger med PUBLIC_PATH=$PUBLIC_PATH..."
  PUBLIC_PATH="$PUBLIC_PATH" npm run build
else
  echo "Bygger utan explicit PUBLIC_PATH."
  npm run build
fi

# Kopiera sitemap*.xml-filerna från www till www-deploy
echo "Försöker kopiera sitemap*.xml-filerna från www till www-deploy..."
cp www/sitemap*.xml www-deploy/ 2>/dev/null

# Skapa en backup av den nuvarande www-mappen med en tidsstämpel
if [ -d "www" ]; then
  echo "Skapar backup av www..."
  mv www www-backup_$(date +%Y%m%d%H%M%S)
fi

# Byt namn på mappen www-deploy till www
echo "Byter namn på www-deploy till www..."
mv www-deploy www

# Hitta alla backup-mappar som matchar mönstret, sortera dem och ta bort de äldsta om det finns fler än 10
backups=( $(ls -d www-backup_* 2>/dev/null | sort) )
echo "Hittade ${#backups[@]} backup(s)"

if [ ${#backups[@]} -gt 10 ]; then
  removeCount=$((${#backups[@]} - 10))
  echo "Tar bort $removeCount äldsta backup(er)..."
  for ((i=0; i<$removeCount; i++)); do
    echo "Tar bort ${backups[$i]}"
    rm -rf "${backups[$i]}"
  done
fi
