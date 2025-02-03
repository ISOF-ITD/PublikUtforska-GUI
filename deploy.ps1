# Kör npm-skriptet för att bygga applikationen (bygger till www-deploy)
npm install
npm run build

# Skapa en tidsstämpel i formatet yyyyMMddHHmmss
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

# Om mappen "www" finns, byt namn på den till en backup med tidsstämpel
if (Test-Path "www") {
    Rename-Item -Path "www" -NewName "www-backup_$timestamp"
}

# Byt namn på mappen "www-deploy" till "www"
Rename-Item -Path "www-deploy" -NewName "www"

# Hämta alla mappar som matchar "www-backup_*", sortera dem efter senaste ändring (äldsta först)
$backups = Get-ChildItem -Directory -Filter "www-backup_*" | Sort-Object LastWriteTime

# Om det finns fler än 10 backup-mappar, ta bort de äldsta
if ($backups.Count -gt 10) {
    $toRemove = $backups | Select-Object -First ($backups.Count - 10)
    Write-Host "Tar bort $($toRemove.Count) äldsta backup(er)..."
    foreach ($backup in $toRemove) {
        Write-Host "Tar bort $($backup.FullName)"
        Remove-Item $backup.FullName -Recurse -Force
    }
}