param(
    [string]$PublicPath = "",
    [int]$KeepDays = $(if ($env:KEEP_RELEASE_DAYS) { [int]$env:KEEP_RELEASE_DAYS } else { 7 }),
    [string]$ReleaseId = $(if ($env:RELEASE_ID) { $env:RELEASE_ID } else { Get-Date -Format "yyyyMMddHHmmss" })
)

$ErrorActionPreference = "Stop"

# Stable files are published to www/. Versioned build assets are published to
# www/releases/<release-id>/ so old browser tabs can still load their chunks.
$BuildDir = "www-deploy"
$WwwDir = "www"
$ReleasesDir = Join-Path $WwwDir "releases"

if ($ReleaseId -notmatch "^[A-Za-z0-9._-]+$") {
    throw "ReleaseId far bara innehalla bokstaver, siffror, punkt, understreck och bindestreck."
}

$BasePublicPath = if ([string]::IsNullOrEmpty($PublicPath)) { "/" } else { $PublicPath }

if (-not $BasePublicPath.EndsWith("/")) {
    $BasePublicPath = "$BasePublicPath/"
}

$AssetPublicPath = "${BasePublicPath}releases/$ReleaseId/"
$ReleaseDir = Join-Path $ReleasesDir $ReleaseId

if (Test-Path $ReleaseDir) {
    throw "Releasekatalogen finns redan: $ReleaseDir"
}

Write-Host "Bygger release $ReleaseId med PUBLIC_PATH=$AssetPublicPath..."

npm install
if ($LASTEXITCODE -ne 0) {
    throw "npm install misslyckades."
}

$env:PUBLIC_PATH = $AssetPublicPath
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "npm run build misslyckades."
}

New-Item -ItemType Directory -Force -Path $ReleasesDir | Out-Null
New-Item -ItemType Directory -Path $ReleaseDir | Out-Null

Write-Host "Publicerar assets till $ReleaseDir..."
Copy-Item -Path (Join-Path $BuildDir "*") -Destination $ReleaseDir -Recurse -Force

Write-Host "Uppdaterar stabila filer i $WwwDir..."
Copy-Item -Path (Join-Path $ReleaseDir "index.html") -Destination (Join-Path $WwwDir "index.html") -Force

$favicon = Join-Path $ReleaseDir "favicon.ico"
if (Test-Path $favicon) {
    Copy-Item -Path $favicon -Destination (Join-Path $WwwDir "favicon.ico") -Force
}

Get-ChildItem -Path $ReleaseDir -Filter "google*.html" | Copy-Item -Destination $WwwDir -Force
Get-ChildItem -Path $ReleaseDir -Filter "varning.template*" | Copy-Item -Destination $WwwDir -Force

foreach ($staticDir in @("img", "fonts")) {
    $source = Join-Path $ReleaseDir $staticDir
    $destination = Join-Path $WwwDir $staticDir

    if (Test-Path $source) {
        New-Item -ItemType Directory -Force -Path $destination | Out-Null
        Copy-Item -Path (Join-Path $source "*") -Destination $destination -Recurse -Force
    }
}

Set-Content -Path (Join-Path $WwwDir "current-release.txt") -Value $ReleaseId

Write-Host "Rensar releases aldre an $KeepDays dagar..."
$cutoff = (Get-Date).AddDays(-$KeepDays)
Get-ChildItem -Path $ReleasesDir -Directory |
    Where-Object { $_.Name -ne $ReleaseId -and $_.LastWriteTime -lt $cutoff } |
    Remove-Item -Recurse -Force

Remove-Item -Path $BuildDir -Recurse -Force

Write-Host "Release $ReleaseId ar publicerad."
