# Check Guru Mobile Backup on K: and L:
$kPath = "K:\Guru mobile backup"
$lPath = "L:\Guru mobile backup"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   GURU MOBILE BACKUP HEALTH & SYNC CHECK" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1] DRIVE K: SOURCE FOLDER ($kPath):" -ForegroundColor Yellow
if (Test-Path $kPath) {
    $kFiles = Get-ChildItem -Path $kPath -Recurse -File -ErrorAction SilentlyContinue
    $kSum = ($kFiles | Measure-Object -Property Length -Sum).Sum
    $kSizeGB = [math]::Round($kSum / 1GB, 2)
    Write-Host "    - Status:        EXISTS" -ForegroundColor Green
    Write-Host "    - Total Files:   $($kFiles.Count)"
    Write-Host "    - Total Size:    $kSizeGB GB ($kSum bytes)"
    Write-Host "    - Subdirectories:"
    Get-ChildItem -Path $kPath -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "      * $($_.Name)"
    }
} else {
    Write-Host "    - Status:        NOT FOUND on Drive K:\" -ForegroundColor Red
}

Write-Host ""
Write-Host "[2] DRIVE L: BACKUP FOLDER ($lPath):" -ForegroundColor Yellow
if (Test-Path $lPath) {
    $lFiles = Get-ChildItem -Path $lPath -Recurse -File -ErrorAction SilentlyContinue
    $lSum = ($lFiles | Measure-Object -Property Length -Sum).Sum
    $lSizeGB = [math]::Round($lSum / 1GB, 2)
    Write-Host "    - Status:        EXISTS" -ForegroundColor Green
    Write-Host "    - Total Files:   $($lFiles.Count)"
    Write-Host "    - Total Size:    $lSizeGB GB ($lSum bytes)"
} else {
    Write-Host "    - Status:        NOT FOUND on Drive L:\" -ForegroundColor Red
}
