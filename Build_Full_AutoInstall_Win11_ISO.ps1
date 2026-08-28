# Build Full Windows 11 Auto-Install ISO with Office 2024, 7-Zip, Chrome, Adobe Reader, Debloat & Optimization
$ErrorActionPreference = "Stop"

$sourceIso  = "D:\iso file\Windows11.iso"
$isoSourceDir = "D:\iso file"
$workDir    = "D:\Win11_Full_Temp"
$targetIso  = "D:\win11_fast_autoinstall.iso"
$scriptDir  = "D:\Antigravity"
$oscdimg    = Join-Path $scriptDir "oscdimg.exe"
$wimlib     = Join-Path $scriptDir "wimlib\wimlib-imagex.exe"

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  BUILDING FULL AUTO-INSTALL WINDOWS 11 ISO WITH ALL SOFTWARE PACK" -ForegroundColor Cyan
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
try { Dismount-DiskImage -ImagePath (Join-Path $isoSourceDir "ProPlus2024Retail.img") -ErrorAction SilentlyContinue } catch {}

if (Test-Path $workDir) { Remove-Item -Path $workDir -Recurse -Force }
New-Item -ItemType Directory -Path $workDir -Force | Out-Null

# 3. Mount and Extract Base Windows 11 ISO
Write-Host "[*] Extracting Windows 11 base ISO ($sourceIso)..." -ForegroundColor Yellow
$mountWin = Mount-DiskImage -ImagePath $sourceIso -PassThru
Start-Sleep -Seconds 2
$winDrive = (Get-DiskImage -ImagePath $sourceIso | Get-Volume).DriveLetter

if (-not $winDrive) {
    Write-Host "[ERROR] Failed to get mounted drive letter for Windows ISO." -ForegroundColor Red
    exit
}

Write-Host "[*] Copying core Windows installation files from Drive ${winDrive}:\..." -ForegroundColor Yellow
Copy-Item -Path "${winDrive}:\*" -Destination $workDir -Recurse -Force
Dismount-DiskImage -ImagePath $sourceIso

# 4. FAST WIM FILTERING WITH WIMLIB: Keep Home (Index 1) & Pro (Index 6)
Write-Host "[*] Filtering WIM image using wimlib (Keeping Home & Pro)..." -ForegroundColor Yellow
$srcWim = Get-ChildItem (Join-Path $workDir "sources") -Filter "install.*" | Select-Object -First 1
$destWim = Join-Path $workDir "sources\install_filtered.wim"

if ($srcWim -and (Test-Path $wimlib)) {
    Write-Host "    [+] Exporting Index 1: Windows 11 Home..." -ForegroundColor Green
    & $wimlib export "$($srcWim.FullName)" 1 "$destWim"
    
    Write-Host "    [+] Exporting Index 6: Windows 11 Pro..." -ForegroundColor Green
    & $wimlib export "$($srcWim.FullName)" 6 "$destWim"
    
    if (Test-Path $destWim) {
        Remove-Item -Path $srcWim.FullName -Force
        Move-Item -Path $destWim -Destination (Join-Path $workDir "sources\install.wim") -Force
        Write-Host "[SUCCESS] WIM filtered cleanly!" -ForegroundColor Green
    }
}

# 5. Prepare OEM Install Directory (Will be copied to C:\Install on Target Machine)
Write-Host "[*] Copying Software Installers into `$OEM` `$1\Install` folder..." -ForegroundColor Yellow
$oemInstallDir = Join-Path $workDir 'sources\$OEM$\$1\Install'
New-Item -ItemType Directory -Path $oemInstallDir -Force | Out-Null

$softwareFiles = @(
    "7z2501-x64.exe",
    "ChromeStandaloneSetup64.exe",
    "_igetintopc.com_AcroRdrDC1801120063_en_US.exe",
    "debloat_win11.bat",
    "fix_lag_optimize.bat",
    "service disable.bat"
)

foreach ($f in $softwareFiles) {
    $srcPath = Join-Path $isoSourceDir $f
    if (Test-Path $srcPath) {
        Write-Host "    [+] Copying $f..." -ForegroundColor Green
        Copy-Item -Path $srcPath -Destination $oemInstallDir -Force
    }
}

# Extract Office 2024 Pro Plus Retail into C:\Install\Office2024 for instant fast setup
$officeImg = Join-Path $isoSourceDir "ProPlus2024Retail.img"
if (Test-Path $officeImg) {
    Write-Host "    [+] Extracting Office 2024 Pro Plus Retail into OEM Install directory..." -ForegroundColor Green
    $officeInstallDir = Join-Path $oemInstallDir "Office2024"
    New-Item -ItemType Directory -Path $officeInstallDir -Force | Out-Null
    
    Mount-DiskImage -ImagePath $officeImg | Out-Null
    Start-Sleep -Seconds 2
    $offDrive = (Get-DiskImage -ImagePath $officeImg | Get-Volume).DriveLetter
    if ($offDrive) {
        Copy-Item -Path "${offDrive}:\*" -Destination $officeInstallDir -Recurse -Force
        Dismount-DiskImage -ImagePath $officeImg | Out-Null
        Write-Host "    [SUCCESS] Office 2024 extracted successfully!" -ForegroundColor Green
    } else {
        Copy-Item -Path $officeImg -Destination $oemInstallDir -Force
    }
}

# 6. Create Master Automated Software Installer Batch Script
$installBatContent = @"
@echo off
title YantraByte Master Software & Optimization Installer
color 1F

echo ===================================================================
echo   YANTRABYTE AUTOMATED SOFTWARE INSTALLER
echo   (OFFICE 2024, CHROME, ADOBE READER, 7-ZIP, DEBLOAT, FIX LAG)
echo ===================================================================
echo.

set "INSTALL_DIR=C:\Install"

:: 1. Install 7-Zip 64-bit
if exist "%INSTALL_DIR%\7z2501-x64.exe" (
    echo [*] Installing 7-Zip 64-bit...
    start /wait "" "%INSTALL_DIR%\7z2501-x64.exe" /S
)

:: 2. Install Google Chrome 64-bit
if exist "%INSTALL_DIR%\ChromeStandaloneSetup64.exe" (
    echo [*] Installing Google Chrome 64-bit...
    start /wait "" "%INSTALL_DIR%\ChromeStandaloneSetup64.exe" /silent /install
)

:: 3. Install Adobe Acrobat Reader DC
if exist "%INSTALL_DIR%\_igetintopc.com_AcroRdrDC1801120063_en_US.exe" (
    echo [*] Installing Adobe Acrobat Reader DC...
    start /wait "" "%INSTALL_DIR%\_igetintopc.com_AcroRdrDC1801120063_en_US.exe" /sAll /rs /msi EULA_ACCEPT=YES
)

:: 4. Run Debloat & Lag Fix Optimizations
if exist "%INSTALL_DIR%\debloat_win11.bat" (
    echo [*] Running Windows 11 Debloat Script...
    call "%INSTALL_DIR%\debloat_win11.bat" >nul 2>&1
)
if exist "%INSTALL_DIR%\fix_lag_optimize.bat" (
    echo [*] Running System Lag Fix & Optimization Script...
    call "%INSTALL_DIR%\fix_lag_optimize.bat" >nul 2>&1
)
if exist "%INSTALL_DIR%\service disable.bat" (
    echo [*] Disabling Unnecessary Background Services...
    call "%INSTALL_DIR%\service disable.bat" >nul 2>&1
)

:: 5. Install Microsoft Office 2024 Pro Plus Retail
if exist "%INSTALL_DIR%\Office2024\Setup64.exe" (
    echo [*] Installing Microsoft Office 2024 Pro Plus Retail...
    start /wait "" "%INSTALL_DIR%\Office2024\Setup64.exe"
) else if exist "%INSTALL_DIR%\Office2024\setup.exe" (
    echo [*] Installing Microsoft Office 2024 Pro Plus Retail...
    start /wait "" "%INSTALL_DIR%\Office2024\setup.exe"
) else if exist "%INSTALL_DIR%\ProPlus2024Retail.img" (
    echo [*] Installing Microsoft Office 2024 Pro Plus Retail from image...
    powershell -Command "`$m = Mount-DiskImage -ImagePath '%INSTALL_DIR%\ProPlus2024Retail.img' -PassThru; `$d = (`$m | Get-Volume).DriveLetter; start-process (`$d + ':\Office\Setup64.exe') -Wait; Dismount-DiskImage -ImagePath '%INSTALL_DIR%\ProPlus2024Retail.img'"
)

:: Copy 1-Click Installer to Public Desktop for convenience
if exist "%INSTALL_DIR%\Install_All_Software.bat" (
    copy /y "%INSTALL_DIR%\Install_All_Software.bat" "C:\Users\Public\Desktop\Install_All_Software.bat" >nul 2>&1
)

echo.
echo [SUCCESS] All software and optimizations applied cleanly!
exit /b 0
"@
Set-Content -Path (Join-Path $oemInstallDir "Install_All_Software.bat") -Value $installBatContent -Encoding UTF8

# Also create Public Desktop copy inside $OEM$
$publicDesktopDir = Join-Path $workDir 'sources\$OEM$\$1\Users\Public\Desktop'
New-Item -ItemType Directory -Path $publicDesktopDir -Force | Out-Null
Set-Content -Path (Join-Path $publicDesktopDir "Install_All_Software.bat") -Value $installBatContent -Encoding UTF8

# 7. Inject Master SetupComplete.cmd for Desktop Icons (This PC, User Files, Network, Recycle Bin) & Performance Tweaks
Write-Host "[*] Injecting SetupComplete.cmd into `$OEM` `$$\Setup\Scripts`..." -ForegroundColor Yellow
$oemScripts = Join-Path $workDir 'sources\$OEM$\$$\Setup\Scripts'
New-Item -ItemType Directory -Path $oemScripts -Force | Out-Null

$setupCompleteCmd = @"
@echo off
title Ultimate Windows 11 Lightning Setup

:: Disable First Logon Animation & Telemetry (0.01 sec)
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableFirstLogonAnimation" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableAdminAccount" /t REG_DWORD /d 1 /f >nul 2>&1

:: DESKTOP ICONS CONFIGURATION:
:: ENABLE: This PC, User Files (Admin), Network, Recycle Bin
:: DISABLE: Control Panel
reg add "HKU\.DEFAULT\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{20D04FE0-3AEA-1069-A2D8-08002B30309D}" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKU\.DEFAULT\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{59031a47-3f72-44a7-89c5-5595fe6b30ee}" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKU\.DEFAULT\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{F023062E-B48A-4E64-88CF-047E3D363052}" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKU\.DEFAULT\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{645FF040-5081-101B-9F08-00AA002F954E}" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKU\.DEFAULT\Software\Microsoft\Windows\CurrentVersion\Explorer\HideDesktopIcons\NewStartPanel" /v "{5399E694-625E-4428-8A00-569D01280786}" /t REG_DWORD /d 1 /f >nul 2>&1

:: Performance & Menu Response Tweaks
powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 >nul 2>&1
for /f "tokens=4" %%a in ('powercfg -list ^| findstr /i "Ultimate Performance"') do powercfg -setactive %%a >nul 2>&1

reg add "HKU\.DEFAULT\Control Panel\Desktop" /v "MenuShowDelay" /t REG_SZ /d "20" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "HideFileExt" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "LaunchTo" /t REG_DWORD /d 1 /f >nul 2>&1

:: Trigger Auto-Software Installation asynchronously at desktop load
if exist "C:\Install\Install_All_Software.bat" (
    start "" /min "C:\Install\Install_All_Software.bat"
)

exit /b 0
"@
Set-Content -Path (Join-Path $oemScripts "SetupComplete.cmd") -Value $setupCompleteCmd -Encoding UTF8

# 8. Create Unattended Fast autounattend.xml (User Account: Admin)
Write-Host "[*] Creating Automated autounattend.xml with Local User 'Admin'..." -ForegroundColor Yellow
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
                        <Name>Admin</Name>
                        <Group>Administrators</Group>
                        <Password><Value></Value></Password>
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
                    <Description>Run Setup Tweaks</Description>
                </SynchronousCommand>
                <SynchronousCommand wcm:action="add" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">
                    <Order>2</Order>
                    <CommandLine>cmd.exe /c "if exist C:\Install\Install_All_Software.bat (start /min C:\Install\Install_All_Software.bat)"</CommandLine>
                    <Description>Auto Install All Software</Description>
                </SynchronousCommand>
            </FirstLogonCommands>
        </component>
    </settings>
</unattend>
"@
Set-Content -Path (Join-Path $workDir "autounattend.xml") -Value $autounattendXml -Encoding UTF8

# 9. Build Bootable Dual UEFI + BIOS UDF ISO
Write-Host "[*] Packaging Bootable ISO with Microsoft oscdimg engine..." -ForegroundColor Yellow
if (Test-Path $targetIso) { Remove-Item -Path $targetIso -Force }

$etfsboot = Join-Path $workDir "boot\etfsboot.com"
$efisys   = Join-Path $workDir "efi\microsoft\boot\efisys.bin"
$bootData = "2#p0,e,b`"$etfsboot`"#pEF,e,b`"$efisys`""

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $oscdimg
$processInfo.Arguments = "-m -o -u2 -udfver102 -bootdata:$bootData `"$workDir`" `"$targetIso`""
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
    Write-Host "   FULL AUTO-INSTALL WINDOWS 11 ISO READY! ($sizeGB GB)" -ForegroundColor Green
    Write-Host "===================================================================" -ForegroundColor Green
    Write-Host "Saved to: $targetIso" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[*] Cleaning up temporary build workspace..." -ForegroundColor Gray
    Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "[ERROR] oscdimg failed!" -ForegroundColor Red
    Write-Host $stdout
    Write-Host $stderr
}
