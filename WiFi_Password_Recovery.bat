@echo off
:: ============================================================
::  WiFi PASSWORD RECOVERY - View All Saved WiFi Passwords
:: ============================================================
title WiFi Password Recovery
color 0E
mode con: cols=70 lines=40

echo ====================================================
echo        WiFi PASSWORD RECOVERY TOOL
echo ====================================================
echo.
echo  Fetching all saved WiFi networks and passwords...
echo.
echo ====================================================

setlocal enabledelayedexpansion
set count=0

for /f "tokens=2 delims=:" %%A in ('netsh wlan show profiles ^| findstr "Profile"') do (
    set "wifi=%%A"
    set "wifi=!wifi:~1!"
    set /a count+=1
    echo.
    echo  ----------------------------------------------------
    echo   Network #!count!: !wifi!
    echo  ----------------------------------------------------
    
    for /f "tokens=2 delims=:" %%B in ('netsh wlan show profile name^="!wifi!" key^=clear ^| findstr /C:"Key Content"') do (
        set "pass=%%B"
        set "pass=!pass:~1!"
        echo   Password : !pass!
    )
    
    for /f "tokens=2 delims=:" %%C in ('netsh wlan show profile name^="!wifi!" key^=clear ^| findstr /C:"Authentication"') do (
        set "auth=%%C"
        set "auth=!auth:~1!"
        echo   Security : !auth!
    )
)

echo.
echo ====================================================
echo   Total Networks Found: %count%
echo ====================================================
echo.
echo  Want to save this to a file?
set /p savefile="  (Y/N): "
if /i "%savefile%"=="Y" (
    set "outfile=%USERPROFILE%\Desktop\WiFi_Passwords.txt"
    echo WiFi Passwords - Exported on %date% %time% > "!outfile!"
    echo ============================================== >> "!outfile!"
    for /f "tokens=2 delims=:" %%A in ('netsh wlan show profiles ^| findstr "Profile"') do (
        set "wifi=%%A"
        set "wifi=!wifi:~1!"
        echo. >> "!outfile!"
        echo Network: !wifi! >> "!outfile!"
        for /f "tokens=2 delims=:" %%B in ('netsh wlan show profile name^="!wifi!" key^=clear ^| findstr /C:"Key Content"') do (
            set "pass=%%B"
            set "pass=!pass:~1!"
            echo Password: !pass! >> "!outfile!"
        )
    )
    echo.
    echo  Saved to Desktop: WiFi_Passwords.txt
)
echo.
pause
