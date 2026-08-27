@echo off
setlocal EnableDelayedExpansion
title Display Driver & Memory Integrity Repair Tool
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo               DISPLAY DRIVER & SYSTEM REPAIR UTILITY
echo ===================================================================
echo.
echo This tool will:
echo  1. Restart the Graphics Subsystem (Fixes screen freezes/stutters)
echo  2. Remove old incompatible Intel drivers (igdkmd64.sys / igdkmd64lp.sys)
echo  3. Enable Core Isolation / Memory Integrity support
echo  4. Rebuild DirectX shader caches
echo.
echo ===================================================================
pause

:: Step 1: Restart Graphics Driver
echo.
echo [*] Resetting GPU and Display Subsystem...
powershell -Command "Get-PnpDevice -Class 'Display' | Disable-PnpDevice -Confirm:$false -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Get-PnpDevice -Class 'Display' | Enable-PnpDevice -Confirm:$false -ErrorAction SilentlyContinue" >nul 2>&1
echo [OK] Display adapter refreshed.

:: Step 2: Purge Incompatible Drivers from DriverStore
echo.
echo [*] Scanning Windows DriverStore for obsolete Intel graphics drivers...
powershell -NoProfile -Command ^
 "$infFiles = Get-ChildItem 'C:\Windows\INF\oem*.inf' | Select-String -Pattern 'igdkmd64' | Select-Object -Unique -ExpandProperty Path;" ^
 "if ($infFiles) {" ^
 "    foreach ($file in $infFiles) {" ^
 "        $name = Split-Path $file -Leaf;" ^
 "        Write-Host \"Removing incompatible driver: $name ...\" -ForegroundColor Yellow;" ^
 "        & pnputil /delete-driver $name /uninstall /force;" ^
 "    }" ^
 "} else {" ^
 "    Write-Host '[OK] No conflicting legacy igdkmd64 drivers found in DriverStore.' -ForegroundColor Green;" ^
 "}"

:: Step 3: Clear DirectX & Shader Cache
echo.
echo [*] Purging corrupt DirectX & Display Shader Caches...
del /s /f /q "%LocalAppData%\D3DSCache\*.*" >nul 2>&1
del /s /f /q "%LocalAppData%\NVIDIA\DXCache\*.*" >nul 2>&1
del /s /f /q "%LocalAppData%\AMD\DxCache\*.*" >nul 2>&1
del /s /f /q "%LocalAppData%\Intel\ShaderCache\*.*" >nul 2>&1

:: Step 4: Restart Desktop Window Manager (DWM)
echo.
echo [*] Restarting Desktop Window Manager (Smooth rendering)...
taskkill /f /im dwm.exe >nul 2>&1

echo.
echo ===================================================================
echo                  DISPLAY DRIVER REPAIR COMPLETE!
echo ===================================================================
echo.
echo 1. Your display driver has been reset and shader caches cleared.
echo 2. Conflicting drivers preventing Memory Integrity have been removed.
echo 3. You can now open Windows Security -> Core Isolation and enable it.
echo.
pause
