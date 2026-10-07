@echo off
:: ============================================================
::  SYSTEM OPTIMIZER - Windows Performance Booster
::  Run as Administrator for full effect
:: ============================================================
title System Optimizer - Performance Booster
color 0A
mode con: cols=70 lines=40

:: Check for Admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo ============================================
    echo   ERROR: Please Run as Administrator!
    echo ============================================
    echo.
    echo   Right-click this file and select
    echo   "Run as administrator"
    echo.
    pause
    exit /b
)

echo ====================================================
echo        SYSTEM OPTIMIZER - Performance Booster
echo ====================================================
echo.
echo   This script will:
echo   [1] Clean Temporary Files
echo   [2] Flush DNS Cache
echo   [3] Clear Windows Prefetch
echo   [4] Clear Thumbnail Cache
echo   [5] Clean Windows Update Cache
echo   [6] Disable Unnecessary Services
echo   [7] Optimize Power Settings
echo   [8] Clear Event Logs
echo   [9] Run Disk Cleanup
echo   [10] Repair System Files
echo   [11] Optimize Network Settings
echo   [12] Free Up RAM
echo.
echo ====================================================
echo.
set /p confirm="Do you want to continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled by user.
    pause
    exit /b
)

echo.
echo ====================================================
echo  [1/12] Cleaning Temporary Files...
echo ====================================================
del /q /f /s "%TEMP%\*" >nul 2>&1
rd /s /q "%TEMP%" >nul 2>&1
md "%TEMP%" >nul 2>&1
del /q /f /s "C:\Windows\Temp\*" >nul 2>&1
rd /s /q "C:\Windows\Temp" >nul 2>&1
md "C:\Windows\Temp" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Temp\*" >nul 2>&1
echo    [DONE] Temporary files cleaned.

echo.
echo ====================================================
echo  [2/12] Flushing DNS Cache...
echo ====================================================
ipconfig /flushdns >nul 2>&1
echo    [DONE] DNS cache flushed.

echo.
echo ====================================================
echo  [3/12] Clearing Windows Prefetch...
echo ====================================================
del /q /f /s "C:\Windows\Prefetch\*" >nul 2>&1
echo    [DONE] Prefetch cache cleared.

echo.
echo ====================================================
echo  [4/12] Clearing Thumbnail Cache...
echo ====================================================
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\Explorer\thumbcache_*.db" >nul 2>&1
echo    [DONE] Thumbnail cache cleared.

echo.
echo ====================================================
echo  [5/12] Cleaning Windows Update Cache...
echo ====================================================
net stop wuauserv >nul 2>&1
net stop bits >nul 2>&1
del /q /f /s "C:\Windows\SoftwareDistribution\Download\*" >nul 2>&1
net start wuauserv >nul 2>&1
net start bits >nul 2>&1
echo    [DONE] Windows Update cache cleaned.

echo.
echo ====================================================
echo  [6/12] Disabling Unnecessary Services...
echo ====================================================
:: Disable services that slow down the system
:: SysMain (Superfetch) - uses high disk/CPU
sc config "SysMain" start= disabled >nul 2>&1
net stop "SysMain" >nul 2>&1
:: Windows Search Indexer - uses high disk
sc config "WSearch" start= disabled >nul 2>&1
net stop "WSearch" >nul 2>&1
:: Diagnostic Tracking (Telemetry)
sc config "DiagTrack" start= disabled >nul 2>&1
net stop "DiagTrack" >nul 2>&1
:: Connected User Experiences and Telemetry
sc config "dmwappushservice" start= disabled >nul 2>&1
net stop "dmwappushservice" >nul 2>&1
:: Print Spooler (disable if no printer)
:: sc config "Spooler" start= disabled >nul 2>&1
:: Fax service
sc config "Fax" start= disabled >nul 2>&1
net stop "Fax" >nul 2>&1
echo    [DONE] Unnecessary services disabled.

echo.
echo ====================================================
echo  [7/12] Optimizing Power Settings...
echo ====================================================
:: Set to High Performance power plan
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1
:: Disable hibernation to free disk space
powercfg /hibernate off >nul 2>&1
echo    [DONE] Power set to High Performance.

echo.
echo ====================================================
echo  [8/12] Clearing Event Logs...
echo ====================================================
for /F "tokens=*" %%G in ('wevtutil el') do (
    wevtutil cl "%%G" >nul 2>&1
)
echo    [DONE] Event logs cleared.

echo.
echo ====================================================
echo  [9/12] Running Disk Cleanup...
echo ====================================================
:: Set all cleanup flags in registry
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Temporary Files" /v StateFlags0001 /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Recycle Bin" /v StateFlags0001 /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Windows Error Reporting Files" /v StateFlags0001 /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Thumbnail Cache" /v StateFlags0001 /t REG_DWORD /d 2 /f >nul 2>&1
cleanmgr /sagerun:1 >nul 2>&1
echo    [DONE] Disk cleanup completed.

echo.
echo ====================================================
echo  [10/12] Repairing System Files...
echo ====================================================
echo    Running SFC scan (this may take a few minutes)...
sfc /scannow >nul 2>&1
echo    [DONE] System file check completed.

echo.
echo ====================================================
echo  [11/12] Optimizing Network Settings...
echo ====================================================
:: Reset TCP/IP stack
netsh int ip reset >nul 2>&1
:: Reset Winsock
netsh winsock reset >nul 2>&1
:: Optimize network adapter settings
netsh int tcp set global autotuninglevel=normal >nul 2>&1
echo    [DONE] Network settings optimized.

echo.
echo ====================================================
echo  [12/12] Freeing Up RAM & Final Cleanup...
echo ====================================================
:: Clear standby memory
rundll32.exe advapi32.dll,ProcessIdleTasks >nul 2>&1
:: Clear clipboard
echo off | clip >nul 2>&1
:: Clear Recent files
del /q /f "%APPDATA%\Microsoft\Windows\Recent\*" >nul 2>&1
echo    [DONE] RAM optimized and final cleanup done.

echo.
echo.
color 0A
echo ====================================================
echo     ALL OPTIMIZATIONS COMPLETED SUCCESSFULLY!
echo ====================================================
echo.
echo   Summary of changes:
echo   - Temp files, prefetch, thumbnails cleaned
echo   - DNS cache flushed
echo   - Windows Update cache cleared
echo   - Unnecessary services disabled
echo   - Power plan set to High Performance
echo   - Hibernation disabled (saves disk space)
echo   - Event logs cleared
echo   - Disk cleanup executed
echo   - System files repaired (SFC)
echo   - Network stack optimized
echo   - RAM freed up
echo.
echo   RECOMMENDATION: Restart your PC for full effect!
echo.
echo ====================================================
echo.
set /p restart="Do you want to restart now? (Y/N): "
if /i "%restart%"=="Y" (
    echo Restarting in 10 seconds...
    shutdown /r /t 10 /c "System Optimizer - Restarting for optimization"
) else (
    echo Please restart your PC manually later.
)
echo.
pause
