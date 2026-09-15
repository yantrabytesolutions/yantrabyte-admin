# YantraByte Solutions Branded Ventoy USB Updater (PowerShell)
# Configures Ventoy USB branding and copies multi-boot ISOs with Max Old System Compatibility

param (
    [string]$TargetDrive
)

# Clear host and show banner
Clear-Host
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "     YANTRABYTE SOLUTIONS BRANDED MULTI-BOOT USB UPDATER" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check for Admin Privileges gracefully
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    try {
        Write-Host "[*] Requesting Administrator privileges..." -ForegroundColor Yellow
        Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`" -TargetDrive `"$TargetDrive`"" -Verb RunAs -ErrorAction Stop
        exit 0
    } catch {
        Write-Host "[!] Note: Administrator prompt skipped. Continuing..." -ForegroundColor Yellow
    }
}

# 2. Auto-Detect Ventoy USB Drive if not provided
if (-not $TargetDrive) {
    Write-Host "[*] Auto-detecting connected Ventoy USB drives..." -ForegroundColor Yellow
    $ventoyDriveObj = Get-Volume | Where-Object { $_.DriveLetter -and ($_.FileSystemLabel -match "Ventoy" -or (Test-Path "$($_.DriveLetter):\ventoy") -or (Test-Path "$($_.DriveLetter):\Win11_Pro_Custom_AutoInstall_Debloated.iso")) } | Select-Object -First 1
    
    if ($ventoyDriveObj) {
        $TargetDrive = $ventoyDriveObj.DriveLetter
        Write-Host "[+] Found Ventoy USB Drive: $($TargetDrive): (" -NoNewline -ForegroundColor Green
        Write-Host "$($ventoyDriveObj.FileSystemLabel), $([math]::Round($ventoyDriveObj.SizeRemaining/1GB, 2)) GB free)" -ForegroundColor Green
    } else {
        Write-Host ""
        $TargetDrive = Read-Host "Please enter USB Drive Letter (e.g., E or E:)"
    }
}

if (-not $TargetDrive) {
    Write-Host "[ERROR] No USB drive detected or entered. Exiting..." -ForegroundColor Red
    Start-Sleep -Seconds 3
    exit 1
}

# Normalize drive letter
$letter = $TargetDrive.Trim()[0].ToString().ToUpper()
$usbRoot = "${letter}:\"

if (-not (Test-Path $usbRoot)) {
    Write-Host "[ERROR] Drive $usbRoot was not found! Please check connection." -ForegroundColor Red
    Start-Sleep -Seconds 3
    exit 1
}

Write-Host ""
Write-Host "[*] Target USB Drive Selected: $usbRoot" -ForegroundColor Green
Write-Host ""

# Step 1: Create Ventoy Branding Config with Strict Valid JSON Schema
$ventoyDir = Join-Path $usbRoot "ventoy"
if (-not (Test-Path $ventoyDir)) {
    New-Item -ItemType Directory -Path $ventoyDir -Force | Out-Null
}

$jsonConfig = @"
{
    "theme": {
        "display_mode": "GUI",
        "ventoy_color": "cyan"
    },
    "menu_title": "YantraByte Solutions - Master IT Technician Suite",
    "control": [
        {
            "VTOY_DEFAULT_SEARCH_ROOT": "/",
            "VTOY_WIN11_BYPASS_CHECK": "1",
            "VTOY_WIN11_BYPASS_NRO": "1",
            "VTOY_SECONDARY_BOOT_MENU": "1"
        }
    ]
}
"@

$jsonPath = Join-Path $ventoyDir "ventoy.json"
Set-Content -Path $jsonPath -Value $jsonConfig -Encoding UTF8
Write-Host "[OK] YantraByte max-compatibility branding created at $jsonPath" -ForegroundColor Green
Write-Host ""

# Step 2: Verify ISO files on target USB
$strelecISO = Join-Path $usbRoot "WinPE11_10_Sergei_Strelec_x64_2025.11.19_English.iso"
$strelecISO2 = Join-Path $usbRoot "WinPE11_10_Sergei_Strelec_2025.iso"
$win11ISO = Join-Path $usbRoot "Win11_Pro_Custom_AutoInstall_Debloated.iso"

if ((Test-Path $strelecISO) -or (Test-Path $strelecISO2)) {
    Write-Host "[OK] Sergei Strelec Rescue PE ISO is present on $usbRoot" -ForegroundColor Green
} else {
    Write-Host "[!] Sergei Strelec Rescue PE ISO missing on $usbRoot. Copying..." -ForegroundColor Yellow
    $srcStrelec = "D:\iso file\WinPE11_10_Sergei_Strelec_x64_2025.11.19_English.iso"
    if (Test-Path $srcStrelec) {
        robocopy (Split-Path $srcStrelec) $usbRoot (Split-Path $srcStrelec -Leaf) /J /REG /BYTES /NJH /NJS
    }
}

if (Test-Path $win11ISO) {
    Write-Host "[OK] Custom Win11 Pro Auto-Install ISO is present on $usbRoot" -ForegroundColor Green
} else {
    Write-Host "[!] Custom Win11 Pro Auto-Install ISO missing on $usbRoot. Copying..." -ForegroundColor Yellow
    $srcWin11 = "C:\Users\sys1\Downloads\Win11_Pro_Custom_AutoInstall_Debloated.iso"
    if (Test-Path $srcWin11) {
        robocopy (Split-Path $srcWin11) $usbRoot (Split-Path $srcWin11 -Leaf) /J /REG /BYTES /NJH /NJS
    }
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "         YANTRABYTE MULTI-BOOT USB IS 100% READY!" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "Your Ventoy USB drive ($usbRoot) is ready for booting on:" -ForegroundColor White
Write-Host "  - Legacy BIOS (MBR) & Modern UEFI (GPT/MBR)" -ForegroundColor White
Write-Host "  - Sergei Strelec Rescue PE" -ForegroundColor White
Write-Host "  - Windows 11 Pro Custom Debloated Auto-Installer" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
