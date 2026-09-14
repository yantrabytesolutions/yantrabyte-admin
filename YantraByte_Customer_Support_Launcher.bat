@echo off
title YantraByte Solutions — Quick Customer Remote Support
color 0A
cls

echo ===================================================================
echo     YANTRABYTE SOLUTIONS — CUSTOMER REMOTE SUPPORT LAUNCHER
echo ===================================================================
echo.
echo Select how you want to provide or request remote support:
echo.
echo   [1] Windows Quick Assist (Built-in to Windows 10/11 — NO DOWNLOAD NEEDED)
echo   [2] Windows Remote Assistance (msra.exe)
echo   [3] Open UltraViewer Official Download Page
echo   [4] Open AnyDesk Official Download Page
echo   [5] Open RustDesk Quick Support Page
echo.
echo ===================================================================
set /p CHOICE="Enter choice [1-5]: "

if "%CHOICE%"=="1" (
    echo [*] Launching Windows Quick Assist...
    start quickassist.exe
    goto end
)
if "%CHOICE%"=="2" (
    echo [*] Launching Windows Remote Assistance...
    start msra.exe /starthelp
    goto end
)
if "%CHOICE%"=="3" (
    echo [*] Opening UltraViewer download page...
    start https://www.ultraviewer.net/en/download.html
    goto end
)
if "%CHOICE%"=="4" (
    echo [*] Opening AnyDesk download page...
    start https://anydesk.com/en/downloads
    goto end
)
if "%CHOICE%"=="5" (
    echo [*] Opening RustDesk Quick Support download page...
    start https://rustdesk.com
    goto end
)

:end
echo.
echo [OK] Support tool launched.
timeout /t 3 >nul
