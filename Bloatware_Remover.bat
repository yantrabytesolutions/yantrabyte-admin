@echo off
:: ============================================================
::  BLOATWARE REMOVER - Remove Junk Windows Apps
::  Run as Administrator
:: ============================================================
title Bloatware Remover
color 0C
mode con: cols=75 lines=45

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo   ERROR: Run as Administrator!
    pause
    exit /b
)

:MENU
cls
echo =========================================================
echo          WINDOWS BLOATWARE REMOVER
echo =========================================================
echo.
echo   [1]  Remove ALL Bloatware (Recommended)
echo   [2]  Remove Games Only (Candy Crush, Solitaire, etc.)
echo   [3]  Remove Social Apps (TikTok, Instagram, Facebook)
echo   [4]  Remove Microsoft Extras (News, Weather, Tips)
echo   [5]  Remove Advertising/Tracking Apps
echo   [6]  Disable Cortana
echo   [7]  Disable Ads in Start Menu ^& Lock Screen
echo   [8]  Remove All + Disable Ads (Full Cleanup)
echo.
echo   [0]  Exit
echo.
echo =========================================================
set /p choice="Select an option (0-8): "

if "%choice%"=="1" goto REMOVE_ALL
if "%choice%"=="2" goto REMOVE_GAMES
if "%choice%"=="3" goto REMOVE_SOCIAL
if "%choice%"=="4" goto REMOVE_MS_EXTRAS
if "%choice%"=="5" goto REMOVE_ADS_APPS
if "%choice%"=="6" goto DISABLE_CORTANA
if "%choice%"=="7" goto DISABLE_ADS
if "%choice%"=="8" goto FULL_CLEANUP
if "%choice%"=="0" exit /b
goto MENU

:REMOVE_ALL
cls
echo  Removing ALL bloatware apps...
echo.
PowerShell -Command "Get-AppxPackage *3dbuilder* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *3dviewer* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingfinance* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingnews* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingsports* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingweather* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *candycrush* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *officehub* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *skypeapp* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *getstarted* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *zunemusic* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *windowsmaps* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *solitairecollection* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *onenote* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *people* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *windowsphone* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *zunevideo* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *windowscommunicationsapps* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *feedback* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *yourphone* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *mixedreality* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *screensketch* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *print3d* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *xbox* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *tiktok* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *instagram* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *facebook* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *spotify* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *twitter* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *clipchamp* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *todos* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *powerautomate* | Remove-AppxPackage" >nul 2>&1
echo  [DONE] All bloatware removed!
echo.
pause
goto MENU

:REMOVE_GAMES
cls
echo  Removing Games...
PowerShell -Command "Get-AppxPackage *candycrush* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *solitairecollection* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *marchofempires* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bubblewitch* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *xbox* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *minecraft* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *royalrevolt* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *hiddenobjects* | Remove-AppxPackage" >nul 2>&1
echo  [DONE] Games removed!
pause
goto MENU

:REMOVE_SOCIAL
cls
echo  Removing Social Apps...
PowerShell -Command "Get-AppxPackage *tiktok* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *instagram* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *facebook* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *twitter* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *spotify* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *skypeapp* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *people* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *yourphone* | Remove-AppxPackage" >nul 2>&1
echo  [DONE] Social apps removed!
pause
goto MENU

:REMOVE_MS_EXTRAS
cls
echo  Removing Microsoft Extras...
PowerShell -Command "Get-AppxPackage *bingnews* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingweather* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingfinance* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingsports* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *getstarted* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *feedback* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *officehub* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *onenote* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *windowsmaps* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *clipchamp* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *todos* | Remove-AppxPackage" >nul 2>&1
echo  [DONE] Microsoft extras removed!
pause
goto MENU

:REMOVE_ADS_APPS
cls
echo  Removing Advertising/Tracking Apps...
PowerShell -Command "Get-AppxPackage *advertising* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *feedback* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *ContentDeliveryManager* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *powerautomate* | Remove-AppxPackage" >nul 2>&1
echo  [DONE] Ad/tracking apps removed!
pause
goto MENU

:DISABLE_CORTANA
cls
echo  Disabling Cortana...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v AllowCortana /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v AllowSearchToUseLocation /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v ConnectedSearchUseWeb /t REG_DWORD /d 0 /f >nul 2>&1
echo  [DONE] Cortana disabled! Restart PC to take effect.
pause
goto MENU

:DISABLE_ADS
cls
echo  Disabling Ads in Start Menu and Lock Screen...
echo.
:: Disable Start Menu ads/suggestions
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SystemPaneSuggestionsEnabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SubscribedContent-338388Enabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SubscribedContent-338389Enabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SubscribedContent-310093Enabled /t REG_DWORD /d 0 /f >nul 2>&1
:: Disable Lock Screen ads
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v RotatingLockScreenEnabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v RotatingLockScreenOverlayEnabled /t REG_DWORD /d 0 /f >nul 2>&1
:: Disable "Get tips, tricks" notifications
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SoftLandingEnabled /t REG_DWORD /d 0 /f >nul 2>&1
:: Disable "Suggested" in Settings
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SubscribedContent-338393Enabled /t REG_DWORD /d 0 /f >nul 2>&1
:: Disable auto-install of suggested apps
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SilentInstalledAppsEnabled /t REG_DWORD /d 0 /f >nul 2>&1
:: Disable timeline suggestions
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SubscribedContent-353698Enabled /t REG_DWORD /d 0 /f >nul 2>&1
echo  [DONE] All ads and suggestions disabled!
pause
goto MENU

:FULL_CLEANUP
cls
echo  Running Full Cleanup (Remove All + Disable Ads)...
echo.
call :REMOVE_ALL_SILENT
call :DISABLE_ADS_SILENT
call :DISABLE_CORTANA_SILENT
echo.
echo  [DONE] Full cleanup complete! Restart PC.
pause
goto MENU

:REMOVE_ALL_SILENT
PowerShell -Command "Get-AppxPackage *3dbuilder* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *3dviewer* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingfinance* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingnews* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingsports* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *bingweather* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *candycrush* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *solitairecollection* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *officehub* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *skypeapp* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *zunemusic* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *windowsmaps* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *people* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *xbox* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *tiktok* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *instagram* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *facebook* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *spotify* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *clipchamp* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *yourphone* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *feedback* | Remove-AppxPackage" >nul 2>&1
PowerShell -Command "Get-AppxPackage *powerautomate* | Remove-AppxPackage" >nul 2>&1
exit /b

:DISABLE_ADS_SILENT
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SystemPaneSuggestionsEnabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SilentInstalledAppsEnabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SoftLandingEnabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v RotatingLockScreenEnabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v RotatingLockScreenOverlayEnabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SubscribedContent-338388Enabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SubscribedContent-338389Enabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SubscribedContent-310093Enabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SubscribedContent-338393Enabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SubscribedContent-353698Enabled /t REG_DWORD /d 0 /f >nul 2>&1
exit /b

:DISABLE_CORTANA_SILENT
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v AllowCortana /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v ConnectedSearchUseWeb /t REG_DWORD /d 0 /f >nul 2>&1
exit /b
