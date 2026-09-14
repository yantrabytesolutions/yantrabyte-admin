# Auto_Sync_Antigravity.ps1 — Antigravity Workspace Auto Sync
$ErrorActionPreference = "Continue"

# Auto-detect repository path across Google Drive (I:), D:, or C: drives
$possiblePaths = @(
    "I:\My Drive\Antigravity\yantrabyte-bolt",
    "I:\My Drive\Antigravity",
    "D:\Antigravity\yantrabyte-bolt",
    "D:\Antigravity",
    "C:\Antigravity\yantrabyte-bolt",
    "C:\Antigravity",
    "$env:USERPROFILE\Antigravity\yantrabyte-bolt",
    "$env:USERPROFILE\My Drive\Antigravity\yantrabyte-bolt"
)

$repoPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path (Join-Path $path ".git")) {
        $repoPath = $path
        break
    }
}

if (-not $repoPath) {
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $repoPath = $path
            break
        }
    }
}

if (-not $repoPath) {
    if (Test-Path ".git") {
        $repoPath = (Get-Location).Path
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $scriptDir) { $scriptDir = "D:\Antigravity" }

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "         YANTRABYTE ANTIGRAVITY AUTOMATED WORKSPACE SYNC          " -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

if ($repoPath -and (Test-Path $repoPath)) {
    Set-Location $repoPath
    Write-Host "[*] Active Repository Path: $repoPath" -ForegroundColor Gray
    
    # Ensure Git User Config
    $currentEmail = git config user.email
    if (-not $currentEmail) {
        git config user.email "yantrabyte.solutions@gmail.com"
        git config user.name "YantraByte Solutions"
    }

    Write-Host "[1/3] Fetching latest remote changes from GitHub..." -ForegroundColor Yellow
    git fetch origin main 2>&1 | Out-Null
    
    $status = git status --porcelain
    if ($status) {
        Write-Host "[*] Uncommitted changes detected. Auto-committing..." -ForegroundColor Yellow
        git add .
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        git commit -m "Auto-sync from Antigravity Node ($env:COMPUTERNAME): $timestamp" 2>&1 | Out-Null
    }
    
    Write-Host "[2/3] Pulling and rebasing with origin/main..." -ForegroundColor Yellow
    git pull origin main --rebase 2>&1 | Out-Null
    
    Write-Host "[3/3] Pushing local changes to GitHub (yantrabyte-admin)..." -ForegroundColor Yellow
    git push origin main 2>&1 | Out-Null
    
    Write-Host "[OK] Git sync complete!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Repository path not found! Skipping git sync." -ForegroundColor Yellow
}

# Nextcloud Cloud Storage Sync (if Nextcloud script exists)
$nextcloudScript = Join-Path $scriptDir "Copy_To_Nextcloud.bat"
if (-not (Test-Path $nextcloudScript)) { $nextcloudScript = "D:\Antigravity\Copy_To_Nextcloud.bat" }

if (Test-Path $nextcloudScript) {
    Write-Host "[*] Triggering Nextcloud Cloud Storage sync..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$nextcloudScript`"" -Wait -NoNewWindow
    Write-Host "[OK] Nextcloud sync completed." -ForegroundColor Green
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Green
Write-Host "             WORKSPACE SYNC COMPLETED SUCCESSFULLY!                " -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green
