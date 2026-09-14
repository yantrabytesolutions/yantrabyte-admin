# Setup_Task_Scheduler.ps1 — Register Automatic Background Sync Tasks in Windows
$ErrorActionPreference = "Continue"

$possibleVbs = @(
    "I:\My Drive\Antigravity\Auto_Sync_Silent.vbs",
    "D:\Antigravity\Auto_Sync_Silent.vbs",
    "C:\Antigravity\Auto_Sync_Silent.vbs"
)

$vbsPath = $null
foreach ($p in $possibleVbs) {
    if (Test-Path $p) {
        $vbsPath = $p
        break
    }
}

if (-not $vbsPath) {
    Write-Host "[ERROR] Could not find Auto_Sync_Silent.vbs script!"
    exit 1
}

Write-Host "YANTRABYTE SOLUTIONS AUTOMATIC WORKSPACE SYNC INSTALLER"
Write-Host "[*] Using VBS script at: $vbsPath"

# 1. Add to Windows Startup Folder
try {
    $wsh = New-Object -ComObject WScript.Shell
    $startupFolder = [System.Environment]::GetFolderPath('Startup')
    $shortcutPath = Join-Path $startupFolder "Antigravity_AutoSync.lnk"
    $shortcut = $wsh.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "wscript.exe"
    $shortcut.Arguments = "`"$vbsPath`""
    $shortcut.Save()
    Write-Host "[OK] Added to Windows Startup Folder: $shortcutPath"
} catch {
    Write-Host "[WARNING] Could not create Startup shortcut."
}

# 2. Register 15-Minute Task Scheduler Job
$vbsArg = '"' + $vbsPath + '"'
$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument $vbsArg

Write-Host "[*] Registering Scheduled Task: Antigravity_AutoSync_15min..."
$trigger15Min = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15)
try {
    Register-ScheduledTask -TaskName "Antigravity_AutoSync_15min" -Action $action -Trigger $trigger15Min -Force -ErrorAction Stop | Out-Null
    Write-Host "[OK] 15-Minute Background Sync Task created successfully!"
} catch {
    Write-Host "[WARNING] Could not register 15min task via PowerShell cmdlet."
}

Write-Host "[*] Triggering initial background sync..."
Start-Process "wscript.exe" -ArgumentList $vbsArg
Write-Host "AUTOMATIC BACKGROUND SYNC SETUP COMPLETE!"
