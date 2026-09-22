# Build Windows 11 Custom Unattended ISO (Windows 11 Pro Only + All Boot, Password & Power Fixes)
$ErrorActionPreference = "Stop"

$sourceIso  = "D:\iso file\Windows11.iso"
$officeImg  = "D:\iso file\ProPlus2024Retail.img"
$isoSourceFolder = "D:\iso file"

$workDir    = "D:\Win11_Custom_Unattended_Temp"
$targetIso  = "D:\Windows11_Custom_Unattended.iso"
$scriptDir  = "D:\Antigravity"
$oscdimg    = Join-Path $scriptDir "oscdimg.exe"
$wimlib     = Join-Path $scriptDir "wimlib\wimlib-imagex.exe"

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  BUILDING WINDOWS11_CUSTOM_UNATTENDED.ISO (PRO ONLY + ALL FIXES)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check required tools
if (-not (Test-Path $sourceIso)) {
    Write-Host "[ERROR] Could not find $sourceIso!" -ForegroundColor Red
    exit
}

if (-not (Test-Path $oscdimg)) {
    Write-Host "[*] Downloading official Microsoft oscdimg tool..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
    (New-Object System.Net.WebClient).DownloadFile('https://msdl.microsoft.com/download/symbols/oscdimg.exe/9F01AFB765000/oscdimg.exe', $oscdimg)
}

# 2. Prepare workspace
Write-Host "[*] Preparing temporary build workspace ($workDir)..." -ForegroundColor Yellow
try { Dismount-DiskImage -ImagePath $sourceIso -ErrorAction SilentlyContinue } catch {}
try { Dismount-DiskImage -ImagePath $officeImg -ErrorAction SilentlyContinue } catch {}

if (Test-Path $workDir) { Remove-Item -Path $workDir -Recurse -Force }
New-Item -ItemType Directory -Path $workDir -Force | Out-Null

# 3. Mount and Extract Windows 11 ISO
Write-Host "[*] Extracting Windows 11 base ISO ($sourceIso)..." -ForegroundColor Yellow
$mountWin = Mount-DiskImage -ImagePath $sourceIso -PassThru
Start-Sleep -Seconds 2
$winDrive = (Get-DiskImage -ImagePath $sourceIso | Get-Volume).DriveLetter

if (-not $winDrive) {
    Write-Host "[ERROR] Failed to get mounted drive letter for Windows ISO." -ForegroundColor Red
    exit
}

Write-Host "[*] Copying Windows installation files from Drive ${winDrive}:\..." -ForegroundColor Yellow
Copy-Item -Path "${winDrive}:\*" -Destination $workDir -Recurse -Force
Dismount-DiskImage -ImagePath $sourceIso

# 4. INSTANT STREAM EXPORT WITH WIMLIB: Keep ONLY Windows 11 Pro (Index 6)
Write-Host "[*] Filtering WIM image using wimlib (Keeping ONLY Windows 11 Pro)..." -ForegroundColor Yellow
$srcWim = Get-ChildItem (Join-Path $workDir "sources") -Filter "install.*" | Select-Object -First 1
$destWim = Join-Path $workDir "sources\install_filtered.wim"

if ($srcWim -and (Test-Path $wimlib)) {
    Write-Host "    [+] Exporting Index 6: Windows 11 Pro..." -ForegroundColor Green
    & $wimlib export "$($srcWim.FullName)" 6 "$destWim"
    
    if (Test-Path $destWim) {
        Remove-Item -Path $srcWim.FullName -Force
        Move-Item -Path $destWim -Destination (Join-Path $workDir "sources\install.wim") -Force
        Write-Host "[SUCCESS] WIM filtered! Only Windows 11 Pro remains in setup." -ForegroundColor Green
    }
}

# 5. Extract Office 2024 Retail IMG into sources\$OEM$\$1\Installers\Office
$installersDir = Join-Path $workDir 'sources\$OEM$\$1\Installers'
$officeDir = Join-Path $installersDir 'Office'
New-Item -ItemType Directory -Path $officeDir -Force | Out-Null

if (Test-Path $officeImg) {
    Write-Host "[*] Extracting Office 2024 Pro Plus Retail image ($officeImg)..." -ForegroundColor Yellow
    $mountOff = Mount-DiskImage -ImagePath $officeImg -PassThru
    Start-Sleep -Seconds 2
    $offDrive = (Get-DiskImage -ImagePath $officeImg | Get-Volume).DriveLetter
    
    if ($offDrive) {
        Copy-Item -Path "${offDrive}:\*" -Destination $officeDir -Recurse -Force
        Dismount-DiskImage -ImagePath $officeImg
        Write-Host "[OK] Office 2024 installer files added." -ForegroundColor Green
    }
}

# Create Office configuration.xml
$configXml = @"
<Configuration>
  <Add OfficeClientEdition="64">
    <Product ID="ProPlus2024Retail">
      <Language ID="en-us" />
    </Product>
  </Add>
  <Display Level="None" AcceptEULA="TRUE" />
</Configuration>
"@
Set-Content -Path (Join-Path $officeDir "configuration.xml") -Value $configXml -Encoding UTF8

# 6. Copy Offline Software Installers & Batch Tweaks to sources\$OEM$\$1\Installers\
Write-Host "[*] Copying 7-Zip, Chrome, Adobe Reader, and Batch Tweak scripts..." -ForegroundColor Yellow
$softwareFiles = @(
    "7z2501-x64.exe",
    "ChromeStandaloneSetup64.exe",
    "_igetintopc.com_AcroRdrDC1801120063_en_US.exe",
    "debloat_win11.bat",
    "fix_lag_optimize.bat",
    "service disable.bat"
)

foreach ($file in $softwareFiles) {
    $srcPath = Join-Path $isoSourceFolder $file
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination (Join-Path $installersDir $file) -Force
        Write-Host "[OK] Bundled: $file" -ForegroundColor Green
    }
}

# 7. Inject Master SetupComplete.cmd into sources\$OEM$\$$\Setup\Scripts\
Write-Host "[*] Injecting Master SetupComplete.cmd into `$OEM$` folder..." -ForegroundColor Yellow
$oemScripts = Join-Path $workDir 'sources\$OEM$\$$\Setup\Scripts'
New-Item -ItemType Directory -Path $oemScripts -Force | Out-Null

$setupCompleteCmd = @"
@echo off
setlocal EnableDelayedExpansion
title Windows 11 Custom Unattended Setup

:: Disable First Logon Animation
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableFirstLogonAnimation" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableAdminAccount" /t REG_DWORD /d 1 /f >nul 2>&1

:: Disable Telemetry & Unnecessary Background Services (Keep Password & Sensor Services Enabled)
set "SERVICES=BDESVC DiagTrack diagsvc DPS WdiServiceHost WdiSystemHost Netlogon WPCSvc PhoneSvc Fax SCardSvr WalletService WerSvc icssvc MapsBroker XboxGipSvc XblAuthManager XblGameSave XboxNetApiSvc dmwappushservice"

for %%S in (%SERVICES%) do (
    net stop "%%S" /y >nul 2>&1
    sc config "%%S" start= disabled >nul 2>&1
)

:: Ensure Password, Biometric, Sensor & Vault Services are Active
sc config seclogon start= demand >nul 2>&1
sc config SensorService start= demand >nul 2>&1
sc config WbioSrvc start= demand >nul 2>&1
sc config VaultSvc start= auto >nul 2>&1

:: Registry Bloatware & Telemetry Tweaks
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\CloudContent" /v "DisableWindowsConsumerFeatures" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\CloudContent" /v "DisableConsumerAccountStateContent" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection" /v "AllowTelemetry" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" /v "AllowTelemetry" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\AdvertisingInfo" /v "DisabledByGroupPolicy" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v "DisableWebSearch" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v "ConnectedSearchUseWeb" /t REG_DWORD /d 0 /f >nul 2>&1

:: Safe Power Scheme Initialization
powercfg -restoredefaultschemes >nul 2>&1
powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1 || powercfg -setactive 381b4222-f694-41f0-9685-ff5bb260df2e >nul 2>&1

:: Performance & Menu Response Tweaks
reg add "HKU\.DEFAULT\Control Panel\Desktop" /v "MenuShowDelay" /t REG_SZ /d "20" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "HideFileExt" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "LaunchTo" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\GameDVR" /v "AllowGameDVR" /t REG_DWORD /d 0 /f >nul 2>&1

:: Desktop Software Installer Setup
set "INSTALL_DIR=%SystemDrive%\Installers"
if exist "%INSTALL_DIR%" (
    start "" "%INSTALL_DIR%\7z2501-x64.exe" /S >nul 2>&1
    start "" "%INSTALL_DIR%\ChromeStandaloneSetup64.exe" /silent /install >nul 2>&1
    start "" "%INSTALL_DIR%\_igetintopc.com_AcroRdrDC1801120063_en_US.exe" /sAll /rs /msi EULA_ACCEPT=YES >nul 2>&1
    if exist "%INSTALL_DIR%\Office\Office\Setup64.exe" (
        start "" "%INSTALL_DIR%\Office\Office\Setup64.exe" >nul 2>&1
    )
)

exit /b 0
"@
Set-Content -Path (Join-Path $oemScripts "SetupComplete.cmd") -Value $setupCompleteCmd -Encoding UTF8
Write-Host "[OK] SetupComplete.cmd injected." -ForegroundColor Green

# 8. Create Unattended autounattend.xml
Write-Host "[*] Creating Automated autounattend.xml..." -ForegroundColor Yellow
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
                    <Path>reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OOBE" /v "BypassNRO" /t REG_DWORD /d 1 /f</Path>
                </RunSynchronousCommand>
            </RunSynchronous>
        </component>
    </settings>
    <settings pass="oobeSystem">
        <component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
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
                        <Name>User</Name>
                        <Group>Administrators</Group>
                        <Password><Value></Value></Password>
                    </LocalAccount>
                </LocalAccounts>
            </UserAccounts>
            <AutoLogon>
                <Enabled>true</Enabled>
                <Username>User</Username>
                <Password><Value></Value></Password>
            </AutoLogon>
            <FirstLogonCommands>
                <SynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                    <Order>1</Order>
                    <CommandLine>cmd.exe /c "if exist C:\Windows\Setup\Scripts\SetupComplete.cmd (call C:\Windows\Setup\Scripts\SetupComplete.cmd)"</CommandLine>
                    <Description>Run Auto Installer Setup</Description>
                </SynchronousCommand>
            </FirstLogonCommands>
        </component>
    </settings>
</unattend>
"@
Set-Content -Path (Join-Path $workDir "autounattend.xml") -Value $autounattendXml -Encoding UTF8
Write-Host "[OK] Unattended autounattend.xml created." -ForegroundColor Green

# 9. Build Bootable Dual UEFI + BIOS UDF ISO with -h, -l"WIN11_INSTALL", and efisys_noprompt.bin
Write-Host "[*] Packaging Bootable ISO with Microsoft oscdimg engine..." -ForegroundColor Yellow
if (Test-Path $targetIso) { Remove-Item -Path $targetIso -Force }

$etfsboot = Join-Path $workDir "boot\etfsboot.com"
$efisysNoPrompt = Join-Path $workDir "efi\microsoft\boot\efisys_noprompt.bin"
$efisysBin      = Join-Path $workDir "efi\microsoft\boot\efisys.bin"
$efisys = if (Test-Path $efisysNoPrompt) { $efisysNoPrompt } else { $efisysBin }

$bootData = "2#p0,e,b`"$etfsboot`"#pEF,e,b`"$efisys`""

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $oscdimg
$processInfo.Arguments = "-m -o -h -u2 -udfver102 -l`"WIN11_INSTALL`" -bootdata:$bootData `"$workDir`" `"$targetIso`""
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

$process = [System.Diagnostics.Process]::Start($processInfo)
$stdout = $process.StandardOutput.ReadToEnd()
$stderr = $process.StandardError.ReadToEnd()
$process.WaitForExit()

if ($process.ExitCode -eq 0 -and (Test-Path $targetIso)) {
    $sizeGB = [math]::Round((Get-Item $targetIso).Length / 1GB, 2)
    Write-Host ""
    Write-Host "===================================================================" -ForegroundColor Green
    Write-Host "   WINDOWS11_CUSTOM_UNATTENDED.ISO CREATED SUCCESSFULLY! ($sizeGB GB)" -ForegroundColor Green
    Write-Host "===================================================================" -ForegroundColor Green
    Write-Host "Saved to: $targetIso" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[*] Cleaning up temporary build files..." -ForegroundColor Gray
    Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "[ERROR] oscdimg failed!" -ForegroundColor Red
    Write-Host $stdout
    Write-Host $stderr
}
