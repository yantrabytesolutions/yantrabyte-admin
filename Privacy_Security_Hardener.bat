@echo off
:: ============================================================
::  PRIVACY & SECURITY HARDENER - Stop Windows Spying
::  Run as Administrator
:: ============================================================
title Privacy and Security Hardener
color 0D
mode con: cols=75 lines=45

net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo   ERROR: Run as Administrator!
    pause
    exit /b
)

:MENU
cls
echo =========================================================
echo        PRIVACY ^& SECURITY HARDENER
echo =========================================================
echo.
echo   [1]  Disable ALL Telemetry ^& Tracking
echo   [2]  Disable Location Tracking
echo   [3]  Disable Activity History
echo   [4]  Disable Advertising ID
echo   [5]  Disable Clipboard History Sync
echo   [6]  Harden Windows Firewall
echo   [7]  Disable Remote Desktop (Security)
echo   [8]  Disable AutoPlay (USB Security)
echo   [9]  Enable Windows Defender Max Protection
echo   [10] APPLY ALL (Full Privacy Lockdown)
echo.
echo   [0]  Exit
echo.
echo =========================================================
set /p choice="Select an option (0-10): "

if "%choice%"=="1" goto TELEMETRY
if "%choice%"=="2" goto LOCATION
if "%choice%"=="3" goto ACTIVITY
if "%choice%"=="4" goto ADID
if "%choice%"=="5" goto CLIPBOARD
if "%choice%"=="6" goto FIREWALL
if "%choice%"=="7" goto RDP
if "%choice%"=="8" goto AUTOPLAY
if "%choice%"=="9" goto DEFENDER
if "%choice%"=="10" goto APPLY_ALL
if "%choice%"=="0" exit /b
goto MENU

:TELEMETRY
cls
echo  Disabling ALL Telemetry and Tracking...
echo.
:: Disable telemetry
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f >nul 2>&1
:: Disable diagnostic data
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Diagnostics\DiagTrack" /v ShowedToastAtLevel /t REG_DWORD /d 1 /f >nul 2>&1
:: Disable feedback
reg add "HKCU\SOFTWARE\Microsoft\Siuf\Rules" /v NumberOfSIUFInPeriod /t REG_DWORD /d 0 /f >nul 2>&1
:: Disable app diagnostics
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\DeviceAccess\Global\{2297E4E2-5DBE-466D-A12B-0F8286F0D9CA}" /v Value /t REG_SZ /d Deny /f >nul 2>&1
:: Disable Wi-Fi Sense
reg add "HKLM\SOFTWARE\Microsoft\WcmSvc\wifinetworkmanager\config" /v AutoConnectAllowedOEM /t REG_DWORD /d 0 /f >nul 2>&1
:: Stop telemetry services
sc config "DiagTrack" start= disabled >nul 2>&1
net stop "DiagTrack" >nul 2>&1
sc config "dmwappushservice" start= disabled >nul 2>&1
net stop "dmwappushservice" >nul 2>&1
:: Disable Customer Experience Improvement
reg add "HKLM\SOFTWARE\Policies\Microsoft\SQMClient\Windows" /v CEIPEnable /t REG_DWORD /d 0 /f >nul 2>&1
:: Disable typing data collection
reg add "HKCU\SOFTWARE\Microsoft\Input\TIPC" /v Enabled /t REG_DWORD /d 0 /f >nul 2>&1
:: Disable handwriting data sharing
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Privacy" /v TailoredExperiencesWithDiagnosticDataEnabled /t REG_DWORD /d 0 /f >nul 2>&1
echo  [DONE] All telemetry disabled!
pause
goto MENU

:LOCATION
cls
echo  Disabling Location Tracking...
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\DeviceAccess\Global\{BFA794E4-F964-4FDB-90F6-51056BFE4B44}" /v Value /t REG_SZ /d Deny /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\LocationAndSensors" /v DisableLocation /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\LocationAndSensors" /v DisableLocationScripting /t REG_DWORD /d 1 /f >nul 2>&1
echo  [DONE] Location tracking disabled!
pause
goto MENU

:ACTIVITY
cls
echo  Disabling Activity History...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v EnableActivityFeed /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v PublishUserActivities /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v UploadUserActivities /t REG_DWORD /d 0 /f >nul 2>&1
echo  [DONE] Activity history disabled!
pause
goto MENU

:ADID
cls
echo  Disabling Advertising ID...
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo" /v Enabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\AdvertisingInfo" /v DisabledByGroupPolicy /t REG_DWORD /d 1 /f >nul 2>&1
echo  [DONE] Advertising ID disabled!
pause
goto MENU

:CLIPBOARD
cls
echo  Disabling Clipboard History Sync...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v AllowClipboardHistory /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v AllowCrossDeviceClipboard /t REG_DWORD /d 0 /f >nul 2>&1
echo  [DONE] Clipboard sync disabled!
pause
goto MENU

:FIREWALL
cls
echo  Hardening Windows Firewall...
:: Enable firewall on all profiles
netsh advfirewall set allprofiles state on >nul 2>&1
:: Block all inbound by default
netsh advfirewall set allprofiles firewallpolicy blockinbound,allowoutbound >nul 2>&1
:: Enable logging
netsh advfirewall set allprofiles logging filename "%systemroot%\system32\LogFiles\Firewall\pfirewall.log" >nul 2>&1
netsh advfirewall set allprofiles logging maxfilesize 4096 >nul 2>&1
netsh advfirewall set allprofiles logging droppedconnections enable >nul 2>&1
netsh advfirewall set allprofiles logging allowedconnections enable >nul 2>&1
echo  [DONE] Firewall hardened!
pause
goto MENU

:RDP
cls
echo  Disabling Remote Desktop...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 1 /f >nul 2>&1
netsh advfirewall firewall set rule group="Remote Desktop" new enable=No >nul 2>&1
echo  [DONE] Remote Desktop disabled!
pause
goto MENU

:AUTOPLAY
cls
echo  Disabling AutoPlay (USB Security)...
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers" /v DisableAutoplay /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoDriveTypeAutoRun /t REG_DWORD /d 255 /f >nul 2>&1
echo  [DONE] AutoPlay disabled (protects from USB attacks)!
pause
goto MENU

:DEFENDER
cls
echo  Enabling Windows Defender Max Protection...
:: Enable real-time protection
PowerShell -Command "Set-MpPreference -DisableRealtimeMonitoring $false" >nul 2>&1
:: Enable cloud protection
PowerShell -Command "Set-MpPreference -MAPSReporting Advanced" >nul 2>&1
:: Enable automatic sample submission
PowerShell -Command "Set-MpPreference -SubmitSamplesConsent SendAllSamples" >nul 2>&1
:: Enable PUA protection
PowerShell -Command "Set-MpPreference -PUAProtection Enabled" >nul 2>&1
:: Enable network protection
PowerShell -Command "Set-MpPreference -EnableNetworkProtection Enabled" >nul 2>&1
:: Enable controlled folder access
PowerShell -Command "Set-MpPreference -EnableControlledFolderAccess Enabled" >nul 2>&1
:: Scan all downloads
PowerShell -Command "Set-MpPreference -DisableIOAVProtection $false" >nul 2>&1
:: Enable behavior monitoring
PowerShell -Command "Set-MpPreference -DisableBehaviorMonitoring $false" >nul 2>&1
echo  [DONE] Windows Defender set to maximum protection!
echo.
echo  NOTE: Controlled Folder Access may block some apps.
echo  You can whitelist apps in Windows Security settings.
pause
goto MENU

:APPLY_ALL
cls
echo =========================================================
echo  APPLYING FULL PRIVACY LOCKDOWN...
echo =========================================================
echo.
echo  [1/9] Disabling Telemetry...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f >nul 2>&1
sc config "DiagTrack" start= disabled >nul 2>&1
sc config "dmwappushservice" start= disabled >nul 2>&1
net stop "DiagTrack" >nul 2>&1
net stop "dmwappushservice" >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\SQMClient\Windows" /v CEIPEnable /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Input\TIPC" /v Enabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Siuf\Rules" /v NumberOfSIUFInPeriod /t REG_DWORD /d 0 /f >nul 2>&1
echo  [DONE]

echo  [2/9] Disabling Location...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\LocationAndSensors" /v DisableLocation /t REG_DWORD /d 1 /f >nul 2>&1
echo  [DONE]

echo  [3/9] Disabling Activity History...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v EnableActivityFeed /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v PublishUserActivities /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v UploadUserActivities /t REG_DWORD /d 0 /f >nul 2>&1
echo  [DONE]

echo  [4/9] Disabling Advertising ID...
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo" /v Enabled /t REG_DWORD /d 0 /f >nul 2>&1
echo  [DONE]

echo  [5/9] Disabling Clipboard Sync...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v AllowClipboardHistory /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v AllowCrossDeviceClipboard /t REG_DWORD /d 0 /f >nul 2>&1
echo  [DONE]

echo  [6/9] Hardening Firewall...
netsh advfirewall set allprofiles state on >nul 2>&1
netsh advfirewall set allprofiles firewallpolicy blockinbound,allowoutbound >nul 2>&1
echo  [DONE]

echo  [7/9] Disabling Remote Desktop...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 1 /f >nul 2>&1
echo  [DONE]

echo  [8/9] Disabling AutoPlay...
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoDriveTypeAutoRun /t REG_DWORD /d 255 /f >nul 2>&1
echo  [DONE]

echo  [9/9] Maximizing Defender...
PowerShell -Command "Set-MpPreference -DisableRealtimeMonitoring $false; Set-MpPreference -MAPSReporting Advanced; Set-MpPreference -PUAProtection Enabled; Set-MpPreference -EnableNetworkProtection Enabled" >nul 2>&1
echo  [DONE]

echo.
echo =========================================================
echo  FULL PRIVACY LOCKDOWN APPLIED!
echo =========================================================
echo.
echo  Restart your PC for all changes to take effect.
echo.
pause
goto MENU
