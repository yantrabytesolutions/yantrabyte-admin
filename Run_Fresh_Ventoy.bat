@echo off
title Re-Creating Fresh Ventoy USB
color 1F

:: Elevate to Admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process cmd.exe -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

echo ===================================================================
echo   YANTRABYTE RE-CREATING FRESH VENTOY USB BOOTABLE DRIVE
echo ===================================================================
echo.

set "VENTOY_DIR=C:\Users\sys1\Downloads\ventoy-1.1.12-windows\ventoy-1.1.12"
set "VENTOY_EXE=%VENTOY_DIR%\Ventoy2Disk.exe"

echo [*] Step 1: Formatting and Re-installing fresh Ventoy on Drive E: ...
echo.

:: Run Ventoy2Disk in CLI mode with correct syntax
"%VENTOY_EXE%" /I /Drive:E /NOUSBCheck

echo.
echo [*] Waiting for Ventoy installation to complete...
timeout /t 8 /nobreak

echo.
echo [*] Step 2: Applying YantraByte anti-error config...

if not exist "E:\ventoy" mkdir "E:\ventoy"

(
echo {
echo     "theme": {
echo         "display_mode": "CLI",
echo         "ventoy_color": "cyan"
echo     },
echo     "menu_title": "YantraByte Solutions - Universal IT Technician Suite",
echo     "control": [
echo         {
echo             "VTOY_DEFAULT_SEARCH_ROOT": "/",
echo             "VTOY_WIN11_BYPASS_CHECK": "1",
echo             "VTOY_WIN11_BYPASS_NRO": "1",
echo             "VTOY_SECONDARY_BOOT_MENU": "1",
echo             "VTOY_TEXT_MODE": "1"
echo         }
echo     ]
echo }
) > "E:\ventoy\ventoy.json"

echo [OK] Anti-error old system config written to E:\ventoy\ventoy.json
echo.

echo [*] Step 3: Copying Sergei Strelec Rescue ISO...
if exist "D:\iso file\WinPE11_10_Sergei_Strelec_x64_2025.11.19_English.iso" (
    robocopy "D:\iso file" "E:\" "WinPE11_10_Sergei_Strelec_x64_2025.11.19_English.iso" /J /REG /BYTES /NJH /NJS
    echo [OK] Sergei Strelec Rescue ISO copied.
) else (
    echo [!] Sergei Strelec ISO not found, skipping.
)

echo.
echo [*] Step 4: Copying Custom Win11 Pro Auto-Install ISO...
if exist "C:\Users\sys1\Downloads\Win11_Pro_Custom_AutoInstall_Debloated.iso" (
    robocopy "C:\Users\sys1\Downloads" "E:\" "Win11_Pro_Custom_AutoInstall_Debloated.iso" /J /REG /BYTES /NJH /NJS
    echo [OK] Custom Win11 Pro ISO copied.
) else if exist "D:\win11_pro_custom_autoinstall.iso" (
    robocopy "D:\" "E:\" "win11_pro_custom_autoinstall.iso" /J /REG /BYTES /NJH /NJS
    echo [OK] Custom Win11 Pro ISO copied.
) else (
    echo [ERROR] Custom Win11 Pro ISO not found!
)

echo.
echo ===================================================================
echo   FRESH ANTI-ERROR VENTOY USB CREATED SUCCESSFULLY!
echo ===================================================================
echo.
echo You can now safely eject E: and boot on any old or new system.
echo.
pause
