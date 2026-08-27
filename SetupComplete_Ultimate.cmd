@echo off
setlocal EnableDelayedExpansion
title Ultimate Windows 11 Instant Setup

:: ==========================================================
:: 1. DISABLE FIRST LOGON ANIMATION & UNNECESSARY SERVICES (INSTANT)
:: ==========================================================
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableFirstLogonAnimation" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableAdminAccount" /t REG_DWORD /d 1 /f >nul 2>&1

set "SERVICES=BDESVC DiagTrack diagsvc DPS WdiServiceHost WdiSystemHost Netlogon WPCSvc PhoneSvc Fax seclogon SensorService SCardSvr WalletService WbioSrvc WerSvc icssvc MapsBroker XboxGipSvc XblAuthManager XblGameSave XboxNetApiSvc dmwappushservice"

for %%S in (%SERVICES%) do (
    net stop "%%S" /y >nul 2>&1
    sc config "%%S" start= disabled >nul 2>&1
)

:: ==========================================================
:: 2. INSTANT REGISTRY BLOATWARE DISABLER (0.001 SECONDS)
:: ==========================================================
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\CloudContent" /v "DisableWindowsConsumerFeatures" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\CloudContent" /v "DisableConsumerAccountStateContent" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection" /v "AllowTelemetry" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" /v "AllowTelemetry" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\AdvertisingInfo" /v "DisabledByGroupPolicy" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v "DisableWebSearch" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v "ConnectedSearchUseWeb" /t REG_DWORD /d 0 /f >nul 2>&1

:: Disable Telemetry Scheduled Tasks
schtasks /change /tn "Microsoft\Windows\Application Experience\Microsoft Compatibility Appraiser" /disable >nul 2>&1
schtasks /change /tn "Microsoft\Windows\Application Experience\ProgramDataUpdater" /disable >nul 2>&1
schtasks /change /tn "Microsoft\Windows\Autochk\Proxy" /disable >nul 2>&1
schtasks /change /tn "Microsoft\Windows\Customer Experience Improvement Program\Consolidator" /disable >nul 2>&1
schtasks /change /tn "Microsoft\Windows\Customer Experience Improvement Program\UsbCeip" /disable >nul 2>&1

:: ==========================================================
:: 3. SYSTEM PERFORMANCE & MULTIMEDIA RESPONSIVENESS TWEAKS
:: ==========================================================
powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 >nul 2>&1
for /f "tokens=4" %%a in ('powercfg -list ^| findstr /i "Ultimate Performance"') do powercfg -setactive %%a >nul 2>&1

:: Set default settings for all new user profiles via HKU\.DEFAULT and HKLM
reg add "HKU\.DEFAULT\Control Panel\Desktop" /v "MenuShowDelay" /t REG_SZ /d "20" /f >nul 2>&1
reg add "HKU\.DEFAULT\Control Panel\Desktop" /v "WaitToKillAppTimeout" /t REG_SZ /d "2000" /f >nul 2>&1
reg add "HKU\.DEFAULT\Control Panel\Desktop" /v "HungAppTimeout" /t REG_SZ /d "1000" /f >nul 2>&1
reg add "HKLM\SYSTEM\CurrentControlSet\Control" /v "WaitToKillServiceTimeout" /t REG_SZ /d "2000" /f >nul 2>&1

:: Multimedia Responsiveness
reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile" /v "SystemResponsiveness" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games" /v "GPU Priority" /t REG_DWORD /d 8 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games" /v "Priority" /t REG_DWORD /d 6 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games" /v "Scheduling Category" /t REG_SZ /d "High" /f >nul 2>&1

:: File Explorer & GameDVR Tweaks
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "HideFileExt" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "LaunchTo" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\GameDVR" /v "AllowGameDVR" /t REG_DWORD /d 0 /f >nul 2>&1

:: ==========================================================
:: 4. BACKGROUND ASYNCHRONOUS SOFTWARE LAUNCHER (ZERO WAIT SETUP)
:: ==========================================================
set "INSTALL_DIR=%SystemDrive%\Installers"
set "PUBLIC_DESKTOP=C:\Users\Public\Desktop"

:: Copy 1-Click Desktop Software Installer to Public Desktop
if exist "%INSTALL_DIR%" (
    mkdir "%PUBLIC_DESKTOP%" >nul 2>&1
    (
        echo @echo off
        echo title YantraByte Software Silent Installer
        echo echo ===================================================================
        echo echo    YANTRABYTE SOFTWARE INSTALLER (OFFICE 2024, CHROME, ADOBE, 7-ZIP)
        echo echo ===================================================================
        echo echo.
        echo echo [*] Installing 7-Zip 64-bit...
        echo start "" "C:\Installers\7z2501-x64.exe" /S
        echo echo [*] Installing Google Chrome 64-bit...
        echo start "" "C:\Installers\ChromeStandaloneSetup64.exe" /silent /install
        echo echo [*] Installing Adobe Acrobat Reader DC...
        echo start "" "C:\Installers\_igetintopc.com_AcroRdrDC1801120063_en_US.exe" /sAll /rs /msi EULA_ACCEPT=YES
        echo echo [*] Installing Microsoft Office 2024 Pro Plus Retail...
        echo if exist "C:\Installers\Office\Office\Setup64.exe" ( start "" "C:\Installers\Office\Office\Setup64.exe" ) else ( start "" "C:\Installers\Office\Setup.exe" )
        echo.
        echo echo [OK] Software installation started in background! You can close this window.
        echo timeout /t 5 >nul
    ) > "%PUBLIC_DESKTOP%\Install_All_Software.bat"

    :: Also auto-trigger 7-Zip, Chrome, Adobe, Office in background without blocking setup
    start "" "%INSTALL_DIR%\7z2501-x64.exe" /S >nul 2>&1
    start "" "%INSTALL_DIR%\ChromeStandaloneSetup64.exe" /silent /install >nul 2>&1
    start "" "%INSTALL_DIR%\_igetintopc.com_AcroRdrDC1801120063_en_US.exe" /sAll /rs /msi EULA_ACCEPT=YES >nul 2>&1
    if exist "%INSTALL_DIR%\Office\Office\Setup64.exe" (
        start "" "%INSTALL_DIR%\Office\Office\Setup64.exe" >nul 2>&1
    )
)

:: Exit immediately so Windows Setup reboots in 0 seconds!
exit /b 0
