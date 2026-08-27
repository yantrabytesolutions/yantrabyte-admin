@echo off
setlocal EnableDelayedExpansion
title Windows 11 Post-Installation Auto Setup

:: ==========================================================
:: 1. TELEMETRY & PRIVACY POLICY TWEAKS (HKLM ONLY)
:: ==========================================================
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection" /v "AllowTelemetry" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" /v "AllowTelemetry" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\AdvertisingInfo" /v "DisabledByGroupPolicy" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\CloudContent" /v "DisableWindowsConsumerFeatures" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v "DisableWebSearch" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v "ConnectedSearchUseWeb" /t REG_DWORD /d 0 /f >nul 2>&1

:: ==========================================================
:: 2. REMOVE PROVISIONED BLOATWARE (SYSTEM SAFE)
:: ==========================================================
powershell -NoProfile -Command "Get-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue | Where-Object DisplayName -match 'Bing|Solitaire|Skype|FeedbackHub|Zune|TikTok|Disney|CandyCrush|Clipchamp|3DViewer|MixedReality' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue" >nul 2>&1

:: ==========================================================
:: 3. SYSTEM PERFORMANCE & DEFAULT USER REGISTRY TWEAKS
:: ==========================================================
powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 >nul 2>&1
for /f "tokens=4" %%a in ('powercfg -list ^| findstr /i "Ultimate Performance"') do powercfg -setactive %%a >nul 2>&1

:: Set default settings for all new user profiles via HKU\.DEFAULT and HKLM
reg add "HKU\.DEFAULT\Control Panel\Desktop" /v "MenuShowDelay" /t REG_SZ /d "20" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "HideFileExt" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "LaunchTo" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\GameDVR" /v "AllowGameDVR" /t REG_DWORD /d 0 /f >nul 2>&1

:: ==========================================================
:: 4. SILENT INSTALL 7-ZIP
:: ==========================================================
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.7-zip.org/a/7z2408-x64.exe' -OutFile '%temp%\7z_installer.exe' -ErrorAction SilentlyContinue" >nul 2>&1
if exist "%temp%\7z_installer.exe" (
    start /wait "" "%temp%\7z_installer.exe" /S
    del /f /q "%temp%\7z_installer.exe" >nul 2>&1
)

:: ==========================================================
:: 5. SILENT INSTALL GOOGLE CHROME
:: ==========================================================
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://dl.google.com/chrome/install/latest/chrome_installer.exe' -OutFile '%temp%\chrome_installer.exe' -ErrorAction SilentlyContinue" >nul 2>&1
if exist "%temp%\chrome_installer.exe" (
    start /wait "" "%temp%\chrome_installer.exe" /silent /install
    del /f /q "%temp%\chrome_installer.exe" >nul 2>&1
)

:: ==========================================================
:: 6. SILENT INSTALL MICROSOFT OFFICE (IF PRESENT)
:: ==========================================================
if exist "%~dp0Office\setup.exe" (
    start /wait "" "%~dp0Office\setup.exe" /configure "%~dp0Office\configuration.xml"
) else if exist "%SystemDrive%\Office\setup.exe" (
    start /wait "" "%SystemDrive%\Office\setup.exe" /configure "%SystemDrive%\Office\configuration.xml"
)

:: ==========================================================
:: 7. CLEANUP & EXIT SAFELY WITH EXIT CODE 0
:: ==========================================================
del /s /f /q "%temp%\*.*" >nul 2>&1
exit /b 0
