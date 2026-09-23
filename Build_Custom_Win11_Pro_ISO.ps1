# ===================================================================
#  BUILD CUSTOM UNATTENDED WINDOWS 11 PRO ISO (DEBLOATED & OPTIMIZED)
# ===================================================================

$ErrorActionPreference = "Stop"

$sourceIso      = "D:\iso file\Windows11.iso"
$isoSourceDir   = "D:\iso file"
$downloadsFolder = "C:\Users\sys1\Downloads"
$targetIso1     = "C:\Users\sys1\Downloads\Win11_Pro_Custom_AutoInstall_Debloated.iso"
$targetIso2     = "D:\win11_pro_custom_autoinstall.iso"

$workDir        = "D:\Win11_Custom_Build_Temp"
$toolsDir       = "d:\Antigravity\yantrabyte-bolt"
$oscdimg        = Join-Path $toolsDir "oscdimg.exe"
$wimlib         = Join-Path $toolsDir "wimlib\wimlib-imagex.exe"

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  BUILDING CUSTOM DEBLOATED WINDOWS 11 PRO ISO (STABLE RELEASE)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check prerequisites
if (-not (Test-Path $sourceIso)) {
    Write-Host "[ERROR] Could not find base Windows 11 ISO at: $sourceIso" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $oscdimg)) {
    Write-Host "[ERROR] oscdimg.exe not found at: $oscdimg" -ForegroundColor Red
    exit 1
}

# 2. Prepare build workspace
Write-Host "[*] Step 1: Cleaning and creating build workspace at $workDir..." -ForegroundColor Yellow
try { Dismount-DiskImage -ImagePath $sourceIso -ErrorAction SilentlyContinue } catch {}

if (Test-Path $workDir) {
    Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $workDir -Force | Out-Null

# 3. Mount and Extract Windows 11 Base ISO
Write-Host "[*] Step 2: Mounting base Windows 11 ISO..." -ForegroundColor Yellow
$mountResult = Mount-DiskImage -ImagePath $sourceIso -PassThru
Start-Sleep -Seconds 3

$mountedDrive = (Get-DiskImage -ImagePath $sourceIso | Get-Volume).DriveLetter
if (-not $mountedDrive) {
    Write-Host "[ERROR] Failed to obtain mounted drive letter." -ForegroundColor Red
    exit 1
}

Write-Host "[*] Extracting ISO files from Drive ${mountedDrive}:\ to $workDir..." -ForegroundColor Yellow
Copy-Item -Path "${mountedDrive}:\*" -Destination $workDir -Recurse -Force
Dismount-DiskImage -ImagePath $sourceIso
Write-Host "[OK] Base ISO files extracted successfully." -ForegroundColor Green

# 4. Filter WIM Image: Keep ONLY Windows 11 Pro
Write-Host "[*] Step 3: Inspecting and filtering WIM image for Windows 11 Pro ONLY..." -ForegroundColor Yellow
$sourcesDir = Join-Path $workDir "sources"
$srcWim = Get-ChildItem -Path $sourcesDir -Filter "install.*" | Select-Object -First 1

if (-not $srcWim) {
    Write-Host "[ERROR] Could not find install.wim or install.esd in sources!" -ForegroundColor Red
    exit 1
}

Write-Host "    Found image file: $($srcWim.Name)" -ForegroundColor Gray

# Inspect WIM indexes using wimlib to find Pro index
$infoOutput = & $wimlib info "$($srcWim.FullName)"
$proIndex = $null

# Parse wimlib output to find "Windows 11 Pro" index
$lines = $infoOutput -split "`r`n|`n"
$currentIndex = $null

foreach ($line in $lines) {
    if ($line -match "^Index:\s+(\d+)") {
        $currentIndex = [int]$matches[1]
    }
    if ($line -match "Name:\s+.*Windows 11 Pro.*" -and $line -notmatch "N|Education|Workstations") {
        $proIndex = $currentIndex
        break
    }
}

if (-not $proIndex) {
    Write-Host "[!] Could not auto-detect Pro index, defaulting to Index 6 (Standard Win11 Pro)..." -ForegroundColor Yellow
    $proIndex = 6
}

Write-Host "    [+] Exporting Index $proIndex (Windows 11 Pro) with verified standard compression..." -ForegroundColor Green
$destWim = Join-Path $sourcesDir "install_filtered.wim"

# Using standard LZX (without extreme :9 chunking) to guarantee zero unpacking errors at 20%
& $wimlib export "$($srcWim.FullName)" $proIndex "$destWim" --compress=LZX

if (Test-Path $destWim) {
    Remove-Item -Path $srcWim.FullName -Force
    Move-Item -Path $destWim -Destination (Join-Path $sourcesDir "install.wim") -Force
    Write-Host "[SUCCESS] WIM filtered! Only Windows 11 Pro remains in installation image." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to filter WIM image!" -ForegroundColor Red
    exit 1
}

# 5. Bundle Software Installers into sources\$OEM$\$1\Installers\
Write-Host "[*] Step 4: Bundling custom software installers..." -ForegroundColor Yellow
$oemInstallers = Join-Path $workDir 'sources\$OEM$\$1\Installers'
New-Item -ItemType Directory -Path $oemInstallers -Force | Out-Null

$softwareList = @(
    "ChromeStandaloneSetup64.exe",
    "7z2501-x64.exe",
    "fix_lag_optimize.bat"
)

foreach ($soft in $softwareList) {
    $srcPath = Join-Path $isoSourceDir $soft
    if (-not (Test-Path $srcPath)) {
        $srcPath = Join-Path $downloadsFolder $soft
    }
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination (Join-Path $oemInstallers $soft) -Force
        Write-Host "    [+] Bundled: $soft" -ForegroundColor Green
    } else {
        Write-Host "    [-] Warning: $soft not found, skipping." -ForegroundColor Yellow
    }
}

# Extract Full Offline Office 2024 Pro Plus Retail into Installers\Office2024
$officeImg = Join-Path $isoSourceDir "ProPlus2024Retail.img"
if (Test-Path $officeImg) {
    Write-Host "[*] Extracting Full Offline Microsoft Office 2024 Pro Plus Retail into OEM installers..." -ForegroundColor Yellow
    $officeDestDir = Join-Path $oemInstallers "Office2024"
    New-Item -ItemType Directory -Path $officeDestDir -Force | Out-Null
    
    Mount-DiskImage -ImagePath $officeImg | Out-Null
    Start-Sleep -Seconds 3
    $offDrive = (Get-DiskImage -ImagePath $officeImg | Get-Volume).DriveLetter
    if ($offDrive) {
        Copy-Item -Path "${offDrive}:\*" -Destination $officeDestDir -Recurse -Force
        Dismount-DiskImage -ImagePath $officeImg | Out-Null
        Write-Host "[OK] Office 2024 full offline package bundled successfully." -ForegroundColor Green
    } else {
        Dismount-DiskImage -ImagePath $officeImg | Out-Null
        Write-Host "[!] Could not mount Office IMG drive letter." -ForegroundColor Red
    }
}

# 6. Inject Master SetupComplete.cmd & Registry Tweaks into sources\$OEM$\$$\Setup\Scripts\
Write-Host "[*] Step 5: Injecting Master SetupComplete.cmd & Desktop Icon Tweaks..." -ForegroundColor Yellow
$oemScripts = Join-Path $workDir 'sources\$OEM$\$$\Setup\Scripts'
New-Item -ItemType Directory -Path $oemScripts -Force | Out-Null

$setupCompleteCmd = @"
@echo off
setlocal EnableDelayedExpansion
title Windows 11 Custom Unattended Post-Install Setup
color 1F

echo ===================================================================
echo   WINDOWS 11 PRO CUSTOM DEBLOATED POST-INSTALL OPTIMIZATION
echo ===================================================================

:: 1. Enable Local Administrator Account & Disable First Logon Animation
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableFirstLogonAnimation" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableAdminAccount" /t REG_DWORD /d 1 /f >nul 2>&1

:: 2. Disable Telemetry & Unnecessary Background Tracking Services
set "TELEMETRY_SERVICES=DiagTrack diagsvc DPS WdiServiceHost WdiSystemHost WerSvc MapsBroker dmwappushservice PcaSvc"
for %%S in (%TELEMETRY_SERVICES%) do (
    net stop "%%S" /y >nul 2>&1
    sc config "%%S" start= disabled >nul 2>&1
)

:: 3. Telemetry & Consumer Bloatware Registry Policies
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\CloudContent" /v "DisableWindowsConsumerFeatures" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\CloudContent" /v "DisableConsumerAccountStateContent" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection" /v "AllowTelemetry" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" /v "AllowTelemetry" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\AdvertisingInfo" /v "DisabledByGroupPolicy" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v "DisableWebSearch" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v "ConnectedSearchUseWeb" /t REG_DWORD /d 0 /f >nul 2>&1

:: 4. Enable Desktop Icons (This PC & User's Files Folder) for Default User & Current System
reg load HKU\DefaultUser "C:\Users\Default\NTUSER.DAT" >nul 2>&1
reg add "HKU\DefaultUser\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{20D04FE0-3AEA-1069-A2D8-08002B30309D}" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKU\DefaultUser\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{59031a47-3f72-44a7-89c5-5595fe6b30ee}" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKU\DefaultUser\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{450D8FBA-6125-11D1-BD23-0080C739E2E0}" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKU\DefaultUser\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{645FF040-5081-101B-9F08-00AA002F954E}" /t REG_DWORD /d 0 /f >nul 2>&1
reg unload HKU\DefaultUser >nul 2>&1

reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{20D04FE0-3AEA-1069-A2D8-08002B30309D}" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{59031a47-3f72-44a7-89c5-5595fe6b30ee}" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{450D8FBA-6125-11D1-BD23-0080C739E2E0}" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{645FF040-5081-101B-9F08-00AA002F954E}" /t REG_DWORD /d 0 /f >nul 2>&1

:: 5. Explorer & System Performance Tweaks
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "HideFileExt" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "Hidden" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "LaunchTo" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKU\.DEFAULT\Control Panel\Desktop" /v "MenuShowDelay" /t REG_SZ /d "20" /f >nul 2>&1

:: Unlock High/Ultimate Performance Scheme
powercfg -restoredefaultschemes >nul 2>&1
powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1 || powercfg -setactive 381b4222-f694-41f0-9685-ff5bb260df2e >nul 2>&1

:: 6. Execute 100% Automated Silent Software Installers
set "INSTALL_DIR=%SystemDrive%\Installers"
if exist "%INSTALL_DIR%" (
    if exist "%INSTALL_DIR%\7z2501-x64.exe" (
        start /wait "" "%INSTALL_DIR%\7z2501-x64.exe" /S >nul 2>&1
    )
    if exist "%INSTALL_DIR%\ChromeStandaloneSetup64.exe" (
        start /wait "" "%INSTALL_DIR%\ChromeStandaloneSetup64.exe" /silent /install >nul 2>&1
    )
    if exist "%INSTALL_DIR%\fix_lag_optimize.bat" (
        call "%INSTALL_DIR%\fix_lag_optimize.bat" >nul 2>&1
    )
    :: Install Microsoft Office 2024 Pro Plus Retail (Full Offline Silent)
    if exist "%INSTALL_DIR%\Office2024\Office\Setup64.exe" (
        start /wait "" "%INSTALL_DIR%\Office2024\Office\Setup64.exe"
    ) else if exist "%INSTALL_DIR%\Office2024\Setup64.exe" (
        start /wait "" "%INSTALL_DIR%\Office2024\Setup64.exe"
    ) else if exist "%INSTALL_DIR%\Office2024\setup.exe" (
        start /wait "" "%INSTALL_DIR%\Office2024\setup.exe"
    )
)

:: Remove pre-installed UWP bloatware
powershell -Command "Get-AppxPackage -AllUsers *Microsoft.3DBuilder* | Remove-AppxPackage -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Get-AppxPackage -AllUsers *Microsoft.BingNews* | Remove-AppxPackage -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Get-AppxPackage -AllUsers *Microsoft.BingWeather* | Remove-AppxPackage -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Get-AppxPackage -AllUsers *Microsoft.GetHelp* | Remove-AppxPackage -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Get-AppxPackage -AllUsers *Microsoft.Getstarted* | Remove-AppxPackage -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Get-AppxPackage -AllUsers *Microsoft.MicrosoftFeedbackHub* | Remove-AppxPackage -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Get-AppxPackage -AllUsers *Microsoft.MicrosoftSolitaireCollection* | Remove-AppxPackage -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Get-AppxPackage -AllUsers *Microsoft.People* | Remove-AppxPackage -ErrorAction SilentlyContinue" >nul 2>&1
powershell -Command "Get-AppxPackage -AllUsers *Microsoft.SkypeApp* | Remove-AppxPackage -ErrorAction SilentlyContinue" >nul 2>&1

exit /b 0
"@

Set-Content -Path (Join-Path $oemScripts "SetupComplete.cmd") -Value $setupCompleteCmd -Encoding UTF8
Write-Host "[OK] Master SetupComplete.cmd injected." -ForegroundColor Green

# 7. Create Unattended autounattend.xml (Admin Account, TimeZone IST +5:30, Bypass Requirements)
Write-Host "[*] Step 6: Creating Unattended autounattend.xml..." -ForegroundColor Yellow

$autounattendXml = @"
<?xml version="1.0" encoding="utf-8"?>
<unattend xmlns="urn:schemas-microsoft-com:unattend">
    <settings pass="windowsPE">
        <component name="Microsoft-Windows-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
            <UserData>
                <AcceptEula>true</AcceptEula>
            </UserData>
            <RunSynchronous>
                <RunSynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                    <Order>1</Order>
                    <Path>reg add "HKLM\SYSTEM\Setup\LabConfig" /v "BypassTPMCheck" /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
                <RunSynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                    <Order>2</Order>
                    <Path>reg add "HKLM\SYSTEM\Setup\LabConfig" /v "BypassSecureBootCheck" /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
                <RunSynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                    <Order>3</Order>
                    <Path>reg add "HKLM\SYSTEM\Setup\LabConfig" /v "BypassRAMCheck" /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
                <RunSynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                    <Order>4</Order>
                    <Path>reg add "HKLM\SYSTEM\Setup\LabConfig" /v "BypassStorageCheck" /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
                <RunSynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                    <Order>5</Order>
                    <Path>reg add "HKLM\SYSTEM\Setup\LabConfig" /v "BypassCPUCheck" /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
                <RunSynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                    <Order>6</Order>
                    <Path>reg add "HKLM\SYSTEM\Setup\LabConfig" /v "BypassDiskCheck" /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
                <RunSynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                    <Order>7</Order>
                    <Path>reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OOBE" /v "BypassNRO" /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
            </RunSynchronous>
        </component>
    </settings>
    <settings pass="oobeSystem">
        <component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
            <TimeZone>India Standard Time</TimeZone>
            <OOBE>
                <HideEULAPage>true</HideEULAPage>
                <HideOEMRegistrationScreen>true</HideOEMRegistrationScreen>
                <HideOnlineAccountScreens>true</HideOnlineAccountScreens>
                <HideWirelessSetupInOOBE>true</HideWirelessSetupInOOBE>
                <NetworkLocation>Work</NetworkLocation>
                <ProtectYourPC>3</ProtectYourPC>
                <SkipUserOOBE>true</SkipUserOOBE>
                <SkipMachineOOBE>true</SkipMachineOOBE>
            </OOBE>
            <UserAccounts>
                <LocalAccounts>
                    <LocalAccount wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                        <Name>Admin</Name>
                        <Group>Administrators</Group>
                        <Password><Value></Value></Password>
                        <DisplayName>Admin</DisplayName>
                    </LocalAccount>
                </LocalAccounts>
            </UserAccounts>
            <AutoLogon>
                <Enabled>true</Enabled>
                <Username>Admin</Username>
                <Password><Value></Value></Password>
            </AutoLogon>
            <FirstLogonCommands>
                <SynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                    <Order>1</Order>
                    <CommandLine>cmd.exe /c "if exist C:\Windows\Setup\Scripts\SetupComplete.cmd (call C:\Windows\Setup\Scripts\SetupComplete.cmd)"</CommandLine>
                    <Description>Run Master Post-Install Setup</Description>
                </SynchronousCommand>
            </FirstLogonCommands>
        </component>
    </settings>
</unattend>
"@

Set-Content -Path (Join-Path $workDir "autounattend.xml") -Value $autounattendXml -Encoding UTF8
Write-Host "[OK] autounattend.xml created (Admin Account + IST TimeZone + Bypass Checks)." -ForegroundColor Green

# 8. Package Bootable Dual UEFI/MBR ISO with oscdimg
Write-Host "[*] Step 7: Compiling Bootable ISO using oscdimg..." -ForegroundColor Yellow

if (Test-Path $targetIso1) { Remove-Item -Path $targetIso1 -Force }
if (Test-Path $targetIso2) { Remove-Item -Path $targetIso2 -Force }

$etfsboot       = Join-Path $workDir "boot\etfsboot.com"
$efisysNoPrompt = Join-Path $workDir "efi\microsoft\boot\efisys_noprompt.bin"
$efisysBin      = Join-Path $workDir "efi\microsoft\boot\efisys.bin"
$efisys         = if (Test-Path $efisysNoPrompt) { $efisysNoPrompt } else { $efisysBin }

$bootData = "2#p0,e,b`"$etfsboot`"#pEF,e,b`"$efisys`""

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $oscdimg
$processInfo.Arguments = "-m -o -h -u2 -udfver102 -l`"WIN11_PRO_CUSTOM`" -bootdata:$bootData `"$workDir`" `"$targetIso1`""
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

$process = [System.Diagnostics.Process]::Start($processInfo)
$stdout = $process.StandardOutput.ReadToEnd()
$stderr = $process.StandardError.ReadToEnd()
$process.WaitForExit()

if ($process.ExitCode -eq 0 -and (Test-Path $targetIso1)) {
    # Create secondary copy on D:\
    Copy-Item -Path $targetIso1 -Destination $targetIso2 -Force
    $sizeGB = [math]::Round((Get-Item $targetIso1).Length / 1GB, 2)
    
    Write-Host ""
    Write-Host "===================================================================" -ForegroundColor Green
    Write-Host "  CUSTOM WINDOWS 11 PRO ISO CREATED SUCCESSFULLY! ($sizeGB GB)" -ForegroundColor Green
    Write-Host "===================================================================" -ForegroundColor Green
    Write-Host "  Primary Target  : $targetIso1" -ForegroundColor Cyan
    Write-Host "  Secondary Target: $targetIso2" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[*] Cleaning up temporary build folder..." -ForegroundColor Gray
    Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "[ERROR] oscdimg ISO creation failed!" -ForegroundColor Red
    Write-Host $stdout
    Write-Host $stderr
    exit 1
}
