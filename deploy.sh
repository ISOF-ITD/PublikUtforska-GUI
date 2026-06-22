#!/bin/bash

set -euo pipefail

# Stable files are published to www/. Versioned build assets are published to
# www/releases/<release-id>/ so old browser tabs can still load their chunks.
# Example:
# - www/index.html points new visitors to the latest release.
# - An already open tab keeps requesting chunks from its original release URL.
PUBLIC_PATH=""
KEEP_RELEASE_DAYS="${KEEP_RELEASE_DAYS:-7}"
RELEASE_ID="${RELEASE_ID:-$(date +%Y%m%d%H%M%S)}"
BUILD_NODE_OPTIONS="${NODE_OPTIONS:-}"
BUILD_DIR="www-deploy"
WWW_DIR="www"
RELEASES_DIR="$WWW_DIR/releases"

# Supported flags:
# --publicPath: base URL where www is served, for example /demo/test/www/
# --keepDays: how many days old release folders should be kept
# --releaseId: explicit release folder name, otherwise a timestamp is used
while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
    --publicPath)
      PUBLIC_PATH="$2"
      shift
      shift
      ;;
    --keepDays)
      KEEP_RELEASE_DAYS="$2"
      shift
      shift
      ;;
    --releaseId)
      RELEASE_ID="$2"
      shift
      shift
      ;;
    *)
      echo "Okand flagga: $1"
      exit 1
      ;;
  esac
done

if [[ ! "$KEEP_RELEASE_DAYS" =~ ^[0-9]+$ ]]; then
  echo "--keepDays maste vara ett heltal."
  exit 1
fi

if [[ ! "$RELEASE_ID" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "--releaseId far bara innehalla bokstaver, siffror, punkt, understreck och bindestreck."
  exit 1
fi

BASE_PUBLIC_PATH="${PUBLIC_PATH:-/}"

# Webpack publicPath must end with a slash before we append releases/<id>/.
if [[ "${BASE_PUBLIC_PATH: -1}" != "/" ]]; then
  BASE_PUBLIC_PATH="${BASE_PUBLIC_PATH}/"
fi

# All generated JS, CSS, image and font URLs become release-specific.
# This is what prevents ChunkLoadError after a deploy.
ASSET_PUBLIC_PATH="${BASE_PUBLIC_PATH}releases/${RELEASE_ID}/"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"

if [[ -d "$RELEASE_DIR" ]]; then
  echo "Releasekatalogen finns redan: $RELEASE_DIR"
  exit 1
fi

echo "Bygger release $RELEASE_ID med PUBLIC_PATH=$ASSET_PUBLIC_PATH..."

# Node.js memory limits are increased for large builds, 
# but kept separate for install and build steps to avoid
INSTALL_NODE_OPTIONS="--max-old-space-size=1024"
BUILD_NODE_OPTIONS="--openssl-legacy-provider --max-old-space-size=2048"

NODE_OPTIONS="$INSTALL_NODE_OPTIONS" npm install

# Clean up any previous build output before starting a new build
rm -rf "$BUILD_DIR"

NODE_OPTIONS="$BUILD_NODE_OPTIONS" PUBLIC_PATH="$ASSET_PUBLIC_PATH" ./node_modules/.bin/webpack --config webpack.prod.js

mkdir -p "$RELEASES_DIR"
mkdir "$RELEASE_DIR"

echo "Publicerar assets till $RELEASE_DIR..."
# Keep the complete build output inside this immutable release directory.
cp -R "$BUILD_DIR"/. "$RELEASE_DIR"/

echo "Uppdaterar stabila filer i $WWW_DIR..."
# Only index.html is replaced for new visitors. Old tabs keep using the
# index.html and chunk URLs they already loaded from their original release.
cp "$RELEASE_DIR/index.html" "$WWW_DIR/index.html"

if [[ -f "$RELEASE_DIR/favicon.ico" ]]; then
  cp "$RELEASE_DIR/favicon.ico" "$WWW_DIR/favicon.ico"
fi

# Keep verification and warning template files available at the stable root.
for file in "$RELEASE_DIR"/google*.html "$RELEASE_DIR"/varning.template*; do
  if [[ -e "$file" ]]; then
    cp "$file" "$WWW_DIR/"
  fi
done

# Some URLs in templates and metadata are stable root paths, so expose shared
# static assets at www/img and www/fonts as well as inside each release.
if [[ -d "$RELEASE_DIR/img" ]]; then
  mkdir -p "$WWW_DIR/img"
  cp -R "$RELEASE_DIR"/img/. "$WWW_DIR/img"/
fi

if [[ -d "$RELEASE_DIR/fonts" ]]; then
  mkdir -p "$WWW_DIR/fonts"
  cp -R "$RELEASE_DIR"/fonts/. "$WWW_DIR/fonts"/
fi

# Small marker for humans and support scripts to see which release is current.
printf '%s\n' "$RELEASE_ID" > "$WWW_DIR/current-release.txt"

echo "Rensar releases aldre an $KEEP_RELEASE_DAYS dagar..."
# Retention cleanup removes old release folders only after the grace period.
# The current release is explicitly excluded even if timestamps are unusual.
find "$RELEASES_DIR" \
  -mindepth 1 \
  -maxdepth 1 \
  -type d \
  -mtime +"$KEEP_RELEASE_DAYS" \
  ! -name "$RELEASE_ID" \
  -exec rm -rf {} +

rm -rf "$BUILD_DIR"

echo "Release $RELEASE_ID ar publicerad."
