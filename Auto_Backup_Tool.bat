@echo off
:: ============================================================
::  AUTO BACKUP TOOL - SysAdmin Backup Solution
::  Run as Administrator
:: ============================================================
title Auto Backup Tool
color 0A
mode con: cols=75 lines=45
setlocal enabledelayedexpansion

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo   ERROR: Run as Administrator!
    pause
    exit /b
)

:MENU
cls
echo =========================================================
echo          AUTO BACKUP TOOL
echo =========================================================
echo.
echo   --- Quick Backup ---
echo   [1]  Backup Desktop
echo   [2]  Backup Documents
echo   [3]  Backup Downloads
echo   [4]  Backup Pictures ^& Videos
echo   [5]  Backup ALL User Folders
echo.
echo   --- Custom Backup ---
echo   [6]  Backup Custom Folder
echo   [7]  Backup Multiple Folders
echo.
echo   --- System Backup ---
echo   [8]  Backup Registry
echo   [9]  Backup Drivers
echo   [10] Backup Installed Software List
echo   [11] Backup WiFi Passwords
echo   [12] Backup Browser Bookmarks
echo.
echo   --- Scheduled Backup ---
echo   [13] Schedule Daily Auto-Backup
echo   [14] Remove Scheduled Backup
echo.
echo   --- Full Backup ---
echo   [15] FULL BACKUP (Everything)
echo.
echo   [0]  Exit
echo.
echo =========================================================
set /p choice="Select an option (0-15): "

if "%choice%"=="1" goto BK_DESKTOP
if "%choice%"=="2" goto BK_DOCS
if "%choice%"=="3" goto BK_DOWNLOADS
if "%choice%"=="4" goto BK_MEDIA
if "%choice%"=="5" goto BK_ALL_USER
if "%choice%"=="6" goto BK_CUSTOM
if "%choice%"=="7" goto BK_MULTI
if "%choice%"=="8" goto BK_REGISTRY
if "%choice%"=="9" goto BK_DRIVERS
if "%choice%"=="10" goto BK_SOFTWARE
if "%choice%"=="11" goto BK_WIFI
if "%choice%"=="12" goto BK_BOOKMARKS
if "%choice%"=="13" goto SCHEDULE_BK
if "%choice%"=="14" goto REMOVE_SCHEDULE
if "%choice%"=="15" goto FULL_BACKUP
if "%choice%"=="0" exit /b
goto MENU

:GET_DEST
set "backuproot="
echo.
echo  Where do you want to save the backup?
echo  [1] External Drive (D:\Backup)
echo  [2] External Drive (E:\Backup)
echo  [3] Custom Location
set /p dest="Select (1-3): "
if "%dest%"=="1" set "backuproot=D:\Backup"
if "%dest%"=="2" set "backuproot=E:\Backup"
if "%dest%"=="3" (
    set /p backuproot="Enter full backup path: "
)
:: Add date folder
set "today=%date:~-4%%date:~4,2%%date:~7,2%"
set "backupdir=%backuproot%\%today%"
if not exist "%backupdir%" mkdir "%backupdir%"
exit /b

:BK_DESKTOP
cls
echo  BACKUP DESKTOP
call :GET_DEST
echo.
echo  Backing up Desktop to %backupdir%\Desktop ...
robocopy "%USERPROFILE%\Desktop" "%backupdir%\Desktop" /E /R:1 /W:1 /NFL /NDL /NJH /NJS
echo  [DONE] Desktop backed up!
pause
goto MENU

:BK_DOCS
cls
echo  BACKUP DOCUMENTS
call :GET_DEST
echo.
echo  Backing up Documents to %backupdir%\Documents ...
robocopy "%USERPROFILE%\Documents" "%backupdir%\Documents" /E /R:1 /W:1 /NFL /NDL /NJH /NJS
echo  [DONE] Documents backed up!
pause
goto MENU

:BK_DOWNLOADS
cls
echo  BACKUP DOWNLOADS
call :GET_DEST
echo.
echo  Backing up Downloads to %backupdir%\Downloads ...
robocopy "%USERPROFILE%\Downloads" "%backupdir%\Downloads" /E /R:1 /W:1 /NFL /NDL /NJH /NJS
echo  [DONE] Downloads backed up!
pause
goto MENU

:BK_MEDIA
cls
echo  BACKUP PICTURES AND VIDEOS
call :GET_DEST
echo.
echo  Backing up Pictures...
robocopy "%USERPROFILE%\Pictures" "%backupdir%\Pictures" /E /R:1 /W:1 /NFL /NDL /NJH /NJS
echo  Backing up Videos...
robocopy "%USERPROFILE%\Videos" "%backupdir%\Videos" /E /R:1 /W:1 /NFL /NDL /NJH /NJS
echo  [DONE] Media backed up!
pause
goto MENU

:BK_ALL_USER
cls
echo  BACKUP ALL USER FOLDERS
call :GET_DEST
echo.
for %%F in (Desktop Documents Downloads Pictures Videos Music Favorites Contacts) do (
    if exist "%USERPROFILE%\%%F" (
        echo  Backing up %%F...
        robocopy "%USERPROFILE%\%%F" "%backupdir%\%%F" /E /R:1 /W:1 /NFL /NDL /NJH /NJS >nul
        echo  [DONE] %%F
    )
)
echo.
echo  All user folders backed up to %backupdir%
pause
goto MENU

:BK_CUSTOM
cls
echo  BACKUP CUSTOM FOLDER
echo.
set /p srcfolder="Enter folder path to backup: "
call :GET_DEST
echo.
for %%I in ("%srcfolder%") do set "foldername=%%~nxI"
echo  Backing up %foldername%...
robocopy "%srcfolder%" "%backupdir%\%foldername%" /E /R:1 /W:1
echo  [DONE] Backup complete!
pause
goto MENU

:BK_MULTI
cls
echo  BACKUP MULTIPLE FOLDERS
echo.
echo  Enter folder paths one per line. Type DONE when finished.
call :GET_DEST
echo.
set count=0
:MULTI_LOOP
set /p folder="Folder path (or DONE): "
if /i "%folder%"=="DONE" goto MULTI_END
if exist "%folder%" (
    set /a count+=1
    for %%I in ("%folder%") do set "fname=%%~nxI"
    echo  Backing up !fname!...
    robocopy "%folder%" "%backupdir%\!fname!" /E /R:1 /W:1 /NFL /NDL /NJH /NJS >nul
    echo  [DONE]
) else (
    echo  [ERROR] Folder not found: %folder%
)
goto MULTI_LOOP
:MULTI_END
echo.
echo  Backed up %count% folders to %backupdir%
pause
goto MENU

:BK_REGISTRY
cls
echo  BACKUP WINDOWS REGISTRY
call :GET_DEST
echo.
echo  Exporting full registry (this may take a minute)...
reg export HKLM "%backupdir%\HKLM_Backup.reg" /y >nul 2>&1
reg export HKCU "%backupdir%\HKCU_Backup.reg" /y >nul 2>&1
echo  [DONE] Registry backed up!
echo  Files: HKLM_Backup.reg, HKCU_Backup.reg
pause
goto MENU

:BK_DRIVERS
cls
echo  BACKUP ALL INSTALLED DRIVERS
call :GET_DEST
echo.
echo  Exporting drivers...
dism /online /export-driver /destination:"%backupdir%\Drivers"
echo.
echo  [DONE] Drivers backed up to %backupdir%\Drivers
pause
goto MENU

:BK_SOFTWARE
cls
echo  BACKUP INSTALLED SOFTWARE LIST
call :GET_DEST
echo.
echo  Generating software list...
echo Installed Software Report - %date% %time% > "%backupdir%\Installed_Software.txt"
echo ============================================== >> "%backupdir%\Installed_Software.txt"
echo. >> "%backupdir%\Installed_Software.txt"
wmic product get Name,Version,Vendor /format:list 2>nul | findstr /v /r "^$" >> "%backupdir%\Installed_Software.txt"
echo. >> "%backupdir%\Installed_Software.txt"
echo === From Registry === >> "%backupdir%\Installed_Software.txt"
PowerShell -Command "Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* | Select-Object DisplayName, DisplayVersion, Publisher | Sort-Object DisplayName | Format-Table -AutoSize" >> "%backupdir%\Installed_Software.txt" 2>nul
echo  [DONE] Software list saved!
notepad "%backupdir%\Installed_Software.txt"
pause
goto MENU

:BK_WIFI
cls
echo  BACKUP WIFI PASSWORDS
call :GET_DEST
echo.
echo  Exporting WiFi profiles...
set "wifidir=%backupdir%\WiFi_Profiles"
mkdir "%wifidir%" >nul 2>&1
netsh wlan export profile key=clear folder="%wifidir%" >nul 2>&1

echo  Generating password list...
echo WiFi Passwords Backup - %date% > "%backupdir%\WiFi_Passwords.txt"
echo ================================ >> "%backupdir%\WiFi_Passwords.txt"
for /f "tokens=2 delims=:" %%A in ('netsh wlan show profiles ^| findstr "Profile"') do (
    set "wifi=%%A"
    set "wifi=!wifi:~1!"
    echo. >> "%backupdir%\WiFi_Passwords.txt"
    echo Network: !wifi! >> "%backupdir%\WiFi_Passwords.txt"
    for /f "tokens=2 delims=:" %%B in ('netsh wlan show profile name^="!wifi!" key^=clear ^| findstr /C:"Key Content"') do (
        set "pass=%%B"
        set "pass=!pass:~1!"
        echo Password: !pass! >> "%backupdir%\WiFi_Passwords.txt"
    )
)
echo  [DONE] WiFi passwords backed up!
pause
goto MENU

:BK_BOOKMARKS
cls
echo  BACKUP BROWSER BOOKMARKS
call :GET_DEST
echo.
mkdir "%backupdir%\Bookmarks" >nul 2>&1

:: Chrome
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Bookmarks" (
    copy "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Bookmarks" "%backupdir%\Bookmarks\Chrome_Bookmarks.json" >nul
    echo  [DONE] Chrome bookmarks backed up!
) else (
    echo  [SKIP] Chrome not found
)

:: Edge
if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Bookmarks" (
    copy "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Bookmarks" "%backupdir%\Bookmarks\Edge_Bookmarks.json" >nul
    echo  [DONE] Edge bookmarks backed up!
) else (
    echo  [SKIP] Edge not found
)

:: Firefox
set "ffdir=%APPDATA%\Mozilla\Firefox\Profiles"
if exist "%ffdir%" (
    for /d %%D in ("%ffdir%\*") do (
        if exist "%%D\places.sqlite" (
            copy "%%D\places.sqlite" "%backupdir%\Bookmarks\Firefox_Bookmarks.sqlite" >nul
            echo  [DONE] Firefox bookmarks backed up!
        )
    )
) else (
    echo  [SKIP] Firefox not found
)

:: Brave
if exist "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\Bookmarks" (
    copy "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\Bookmarks" "%backupdir%\Bookmarks\Brave_Bookmarks.json" >nul
    echo  [DONE] Brave bookmarks backed up!
) else (
    echo  [SKIP] Brave not found
)

echo.
pause
goto MENU

:SCHEDULE_BK
cls
echo =========================================================
echo  SCHEDULE DAILY AUTO-BACKUP
echo =========================================================
echo.
echo  This will create a daily task that backs up your
echo  Desktop, Documents, Downloads, and Pictures.
echo.
set /p bkdest="Backup destination folder (e.g., D:\Backup): "
set /p bktime="What time? (HH:MM, e.g., 22:00): "
echo.

:: Create backup script
set "scriptpath=%USERPROFILE%\AutoBackup.bat"
echo @echo off > "%scriptpath%"
echo setlocal enabledelayedexpansion >> "%scriptpath%"
echo set "today=%%date:~-4%%%%date:~4,2%%%%date:~7,2%%" >> "%scriptpath%"
echo set "dest=%bkdest%\%%today%%" >> "%scriptpath%"
echo mkdir "%%dest%%" ^>nul 2^>^&1 >> "%scriptpath%"
echo for %%%%F in (Desktop Documents Downloads Pictures) do ( >> "%scriptpath%"
echo     robocopy "%%USERPROFILE%%\%%%%F" "%%dest%%\%%%%F" /E /R:1 /W:1 /NFL /NDL /NJH /NJS ^>nul >> "%scriptpath%"
echo ) >> "%scriptpath%"

schtasks /create /tn "DailyAutoBackup" /tr "%scriptpath%" /sc daily /st %bktime% /f /rl highest
echo.
echo  [DONE] Daily backup scheduled at %bktime%!
echo  Backup location: %bkdest%\[date]\
pause
goto MENU

:REMOVE_SCHEDULE
cls
echo  Removing scheduled backup...
schtasks /delete /tn "DailyAutoBackup" /f >nul 2>&1
del "%USERPROFILE%\AutoBackup.bat" >nul 2>&1
echo  [DONE] Scheduled backup removed!
pause
goto MENU

:FULL_BACKUP
cls
echo =========================================================
echo  FULL BACKUP - EVERYTHING
echo =========================================================
echo.
echo  This will backup:
echo  - All User Folders (Desktop, Documents, Downloads, etc.)
echo  - Registry
echo  - Drivers
echo  - Installed Software List
echo  - WiFi Passwords
echo  - Browser Bookmarks
echo.
call :GET_DEST
echo.
echo  Starting full backup to %backupdir%...
echo.

echo  [1/6] User Folders...
for %%F in (Desktop Documents Downloads Pictures Videos Music Favorites) do (
    if exist "%USERPROFILE%\%%F" (
        robocopy "%USERPROFILE%\%%F" "%backupdir%\UserFolders\%%F" /E /R:1 /W:1 /NFL /NDL /NJH /NJS >nul
        echo    [DONE] %%F
    )
)

echo  [2/6] Registry...
reg export HKLM "%backupdir%\Registry\HKLM.reg" /y >nul 2>&1
reg export HKCU "%backupdir%\Registry\HKCU.reg" /y >nul 2>&1
echo    [DONE] Registry

echo  [3/6] Drivers...
mkdir "%backupdir%\Drivers" >nul 2>&1
dism /online /export-driver /destination:"%backupdir%\Drivers" >nul 2>&1
echo    [DONE] Drivers

echo  [4/6] Software List...
wmic product get Name,Version /format:list > "%backupdir%\Installed_Software.txt" 2>nul
echo    [DONE] Software List

echo  [5/6] WiFi Passwords...
mkdir "%backupdir%\WiFi" >nul 2>&1
netsh wlan export profile key=clear folder="%backupdir%\WiFi" >nul 2>&1
echo    [DONE] WiFi

echo  [6/6] Browser Bookmarks...
mkdir "%backupdir%\Bookmarks" >nul 2>&1
copy "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Bookmarks" "%backupdir%\Bookmarks\Chrome.json" >nul 2>&1
copy "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Bookmarks" "%backupdir%\Bookmarks\Edge.json" >nul 2>&1
echo    [DONE] Bookmarks

echo.
echo =========================================================
echo  FULL BACKUP COMPLETE!
echo =========================================================
echo  Location: %backupdir%
echo.
:: Calculate size
for /f "tokens=3" %%S in ('dir "%backupdir%" /s ^| findstr "File(s)"') do (
    echo  Total Size: %%S bytes
)
echo.
pause
goto MENU
