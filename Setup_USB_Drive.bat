@echo off
setlocal EnableDelayedExpansion
title Auto-Inject Scripts to USB Drive
color 1F

:: Check Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo               AUTO-INJECT POST-INSTALL SCRIPTS TO USB
echo ===================================================================
echo.
echo Please enter the drive letter of your bootable USB drive (e.g., E or F):
set /p USB_LETTER="Drive Letter: "

:: Remove colon or slashes if typed
set "USB_LETTER=%USB_LETTER:~0,1%"
set "USB_ROOT=%USB_LETTER%:\"
set "DEST_DIR=%USB_ROOT%sources\$OEM$\$$\Setup\Scripts"

if not exist "%USB_ROOT%sources" (
    echo.
    echo [ERROR] Could not find "%USB_ROOT%sources".
    echo Please make sure your USB is flashed with Windows 11 and drive letter is correct.
    pause
    exit /b
)

echo.
echo [*] Creating $OEM$ directories on %USB_ROOT%...
mkdir "%DEST_DIR%" >nul 2>&1

echo [*] Copying SetupComplete.cmd...
copy /y "%~dp0SetupComplete.cmd" "%DEST_DIR%\SetupComplete.cmd" >nul

echo.
echo ===================================================================
echo                      INJECTION SUCCESSFUL!
echo ===================================================================
echo.
echo Files installed on: %DEST_DIR%\SetupComplete.cmd
echo.
echo When you boot from this USB to install Windows 11, it will:
echo   - Automatically remove bloatware & telemetry
echo   - Set Ultimate Performance & 20ms menu response
echo   - Automatically install Google Chrome
echo   - Automatically install 7-Zip
echo   - Automatically install Microsoft Office
echo.
pause
