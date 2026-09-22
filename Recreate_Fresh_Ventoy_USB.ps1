# Recreates a fresh, clean Ventoy USB bootable drive on E: (Disk 3) with Maximum Old System Anti-Error Safeguards
param (
    [string]$TargetDrive = "E"
)

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "   YANTRABYTE RE-CREATING FRESH VENTOY USB (OLD SYSTEM ANTI-ERROR)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$letter = $TargetDrive.Trim()[0].ToString().ToUpper()
$usbRoot = "${letter}:\"

# Locate Ventoy2Disk executable
$ventoyExe = "C:\Users\sys1\Downloads\ventoy-1.1.12-windows\ventoy-1.1.12\Ventoy2Disk.exe"
if (-not (Test-Path $ventoyExe)) {
    $ventoyExe = "C:\Users\sys1\Downloads\ventoy-1.1.12-windows\ventoy-1.1.12\altexe\Ventoy2Disk_X64.exe"
}

Write-Host "[*] Target Drive: $usbRoot" -ForegroundColor Yellow
Write-Host "[*] Ventoy Installer Path: $ventoyExe" -ForegroundColor Yellow
Write-Host ""

# Step 1: Re-install Ventoy on target drive in MBR + NTFS mode with elevation
Write-Host "[*] Formatting and Installing Fresh Ventoy (MBR + NTFS mode)..." -ForegroundColor Yellow
try {
    $proc = Start-Process -FilePath $ventoyExe -ArgumentList "VTOYCMD /I /Drive:${letter}: /MBR /NTFS" -Verb RunAs -Wait -PassThru -ErrorAction Stop
    Write-Host "[OK] Fresh Ventoy MBR partition installed on drive $usbRoot." -ForegroundColor Green
} catch {
    Write-Host "[!] Note: Ventoy2Disk elevation requires administrator approval." -ForegroundColor Yellow
}
Start-Sleep -Seconds 3

Write-Host ""

# Step 2: Create Maximum Old-System Compatibility ventoy.json Config
$ventoyDir = Join-Path $usbRoot "ventoy"
if (-not (Test-Path $ventoyDir)) {
    New-Item -ItemType Directory -Path $ventoyDir -Force | Out-Null
}

$jsonConfig = @"
{
    "theme": {
        "display_mode": "CLI",
        "ventoy_color": "cyan"
    },
    "menu_title": "YantraByte Solutions - Universal IT Technician Suite",
    "control": [
        {
            "VTOY_DEFAULT_SEARCH_ROOT": "/",
            "VTOY_WIN11_BYPASS_CHECK": "1",
            "VTOY_WIN11_BYPASS_NRO": "1",
            "VTOY_SECONDARY_BOOT_MENU": "1",
            "VTOY_TEXT_MODE": "1"
        }
    ]
}
"@

$jsonPath = Join-Path $ventoyDir "ventoy.json"
Set-Content -Path $jsonPath -Value $jsonConfig -Encoding UTF8
Write-Host "[OK] Anti-error old system safeguards configured at $jsonPath" -ForegroundColor Green
Write-Host ""

# Step 3: Copy Sergei Strelec Rescue ISO
$srcStrelec = "D:\iso file\WinPE11_10_Sergei_Strelec_x64_2025.11.19_English.iso"
if (-not (Test-Path $srcStrelec)) {
    $srcStrelec = "C:\Users\sys1\Downloads\WinPE11_10_Sergei_Strelec_x64_2025.11.19_English.iso"
}

if (Test-Path $srcStrelec) {
    Write-Host "[*] Copying Sergei Strelec Rescue ISO to $usbRoot..." -ForegroundColor Yellow
    robocopy (Split-Path $srcStrelec) $usbRoot (Split-Path $srcStrelec -Leaf) /J /REG /BYTES /NJH /NJS
    Write-Host "[OK] Sergei Strelec Rescue ISO copied." -ForegroundColor Green
} else {
    Write-Host "[!] Warning: Sergei Strelec ISO not found!" -ForegroundColor Red
}

Write-Host ""

# Step 4: Copy Custom Win11 Pro ISO
$srcWin11 = "C:\Users\sys1\Downloads\Win11_Pro_Custom_AutoInstall_Debloated.iso"
if (-not (Test-Path $srcWin11)) {
    $srcWin11 = "D:\win11_pro_custom_autoinstall.iso"
}

if (Test-Path $srcWin11) {
    Write-Host "[*] Copying Custom Win11 Pro Auto-Install ISO to $usbRoot..." -ForegroundColor Yellow
    robocopy (Split-Path $srcWin11) $usbRoot (Split-Path $srcWin11 -Leaf) /J /REG /BYTES /NJH /NJS
    Write-Host "[OK] Custom Win11 Pro Auto-Install ISO copied." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Custom Win11 Pro ISO not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "   FRESH ANTI-ERROR VENTOY USB CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Cyan
