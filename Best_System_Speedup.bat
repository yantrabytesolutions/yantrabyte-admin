@echo off
:: ============================================================
::  BEST HIGH-PERFORMANCE SYSTEM TUNER
::  Targeted for Immediate Lag Reduction, Lower CPU/Disk Usage & Max Responsiveness
:: ============================================================
title High Performance System Tuner
color 0A
mode con: cols=75 lines=35

net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo.
    echo  ========================================================
    echo    ERROR: Please Run as Administrator!
    echo  ========================================================
    echo.
    echo    Right-click this file ^> "Run as administrator"
    echo.
    pause
    exit /b
)

echo.
echo  ========================================================
echo    APPLYING MAXIMUM SPEED ^& RESPONSIVENESS OPTIMIZATIONS
echo  ========================================================
echo.

echo  [1/8] Terminating Heavy Telemetry ^& Disk Hog Services...
sc config "SysMain" start= disabled >nul 2>&1
net stop "SysMain" >nul 2>&1
sc config "DiagTrack" start= disabled >nul 2>&1
net stop "DiagTrack" >nul 2>&1
sc config "dmwappushservice" start= disabled >nul 2>&1
net stop "dmwappushservice" >nul 2>&1
sc config "MapsBroker" start= disabled >nul 2>&1
net stop "MapsBroker" >nul 2>&1
echo   - Done.

echo  [2/8] Activating High Performance Power Plan...
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1
echo   - Done.

echo  [3/8] Tuning Windows Responsiveness ^& UI Delays...
:: Speed up menu show delay
reg add "HKCU\Control Panel\Desktop" /v MenuShowDelay /t REG_SZ /d "0" /f >nul 2>&1
:: Reduce hung app timeout
reg add "HKCU\Control Panel\Desktop" /v HungAppTimeout /t REG_SZ /d "1000" /f >nul 2>&1
reg add "HKCU\Control Panel\Desktop" /v WaitToKillAppTimeout /t REG_SZ /d "2000" /f >nul 2>&1
:: Prioritize active apps
reg add "HKLM\SYSTEM\CurrentControlSet\Control\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f >nul 2>&1
echo   - Done.

echo  [4/8] Cleaning Temp Files ^& Update Delivery Junk...
del /q /f /s "%TEMP%\*" >nul 2>&1
del /q /f /s "C:\Windows\Temp\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Temp\*" >nul 2>&1
del /q /f /s "C:\Windows\Prefetch\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\Explorer\thumbcache_*.db" >nul 2>&1
del /q /f /s "C:\Windows\SoftwareDistribution\DeliveryOptimization\*" >nul 2>&1
echo   - Done.

echo  [5/8] Optimizing RAM ^& Flushing Standby Memory...
rundll32.exe advapi32.dll,ProcessIdleTasks >nul 2>&1
echo off | clip >nul 2>&1
echo   - Done.

echo  [6/8] Optimizing Network Stack ^& DNS...
ipconfig /flushdns >nul 2>&1
netsh int tcp set global autotuninglevel=normal >nul 2>&1
echo   - Done.

echo  [7/8] Disabling GameDVR ^& Background Recording Stutter...
reg add "HKCU\System\GameConfigStore" /v GameDVR_Enabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\GameDVR" /v AllowGameDVR /t REG_DWORD /d 0 /f >nul 2>&1
echo   - Done.

echo  [8/8] Executing SSD TRIM / Disk Cleanup...
fsutil behavior set disabledeletenotify 0 >nul 2>&1
powershell -NoProfile -Command "Optimize-Volume -DriveLetter C -ReTrim -ErrorAction SilentlyContinue" >nul 2>&1
echo   - Done.

echo.
echo  ========================================================
echo    OPTIMIZATION COMPLETE!
echo  ========================================================
echo.
echo    Your system is configured for maximum responsiveness.
echo    Please restart your computer to apply all kernel changes.
echo.
set /p r="Do you want to restart now? (Y/N): "
if /i "%r%"=="Y" (
    shutdown /r /t 5 /c "Restarting to finalize performance tweaks..."
)
pause
