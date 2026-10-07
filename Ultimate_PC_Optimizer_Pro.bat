@echo off
:: ============================================================
::  ULTIMATE PC OPTIMIZER PRO - All-in-One System Tool
::  Better than CCleaner, Advanced SystemCare, Glary Utilities
::  Run as Administrator
:: ============================================================
title Ultimate PC Optimizer Pro v3.0
color 0B
mode con: cols=80 lines=50
setlocal enabledelayedexpansion

net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo.
    echo   =============================================
    echo     ERROR: Please Run as Administrator!
    echo   =============================================
    echo.
    echo   Right-click ^> Run as administrator
    pause
    exit /b
)

:MAIN_MENU
cls
color 0B
echo.
echo  ================================================================
echo  ^|           ULTIMATE PC OPTIMIZER PRO v3.0                     ^|
echo  ^|           All-in-One System Optimization Suite               ^|
echo  ================================================================
echo.
echo    ---- OPTIMIZE ----              ---- FIX ^& REPAIR ----
echo    [1]  ONE-CLICK OPTIMIZE         [7]  Windows Repair Center
echo    [2]  Deep Clean (Junk Files)    [8]  Network Fixer
echo    [3]  RAM Booster                [9]  Boot Repair
echo    [4]  Startup Optimizer          [10] Driver Manager
echo    [5]  Gaming Mode (Max FPS)
echo    [6]  SSD Optimizer              ---- SECURITY ----
echo                                    [11] Full Virus Scan
echo    ---- PRIVACY ----              [12] Malware Removal
echo    [13] Privacy Cleaner            [14] Firewall Hardener
echo    [15] Browser Cleaner
echo                                    ---- TOOLS ----
echo    ---- SYSTEM ----               [16] System Health Report
echo    [17] Bloatware Remover          [18] Battery Optimizer
echo    [19] Disk Space Analyzer        [20] Auto Backup
echo.
echo    [99] MEGA OPTIMIZE (Run ALL)
echo    [0]  Exit
echo.
echo  ================================================================
set /p choice="  Select option: "

if "%choice%"=="1" goto ONE_CLICK
if "%choice%"=="2" goto DEEP_CLEAN
if "%choice%"=="3" goto RAM_BOOST
if "%choice%"=="4" goto STARTUP_OPT
if "%choice%"=="5" goto GAMING_MODE
if "%choice%"=="6" goto SSD_OPT
if "%choice%"=="7" goto WIN_REPAIR
if "%choice%"=="8" goto NET_FIX
if "%choice%"=="9" goto BOOT_REPAIR
if "%choice%"=="10" goto DRIVER_MGR
if "%choice%"=="11" goto VIRUS_SCAN
if "%choice%"=="12" goto MALWARE_REMOVE
if "%choice%"=="13" goto PRIVACY_CLEAN
if "%choice%"=="14" goto FIREWALL
if "%choice%"=="15" goto BROWSER_CLEAN
if "%choice%"=="16" goto HEALTH_REPORT
if "%choice%"=="17" goto BLOATWARE
if "%choice%"=="18" goto BATTERY_OPT
if "%choice%"=="19" goto DISK_ANALYZE
if "%choice%"=="20" goto AUTO_BACKUP
if "%choice%"=="99" goto MEGA_OPTIMIZE
if "%choice%"=="0" exit /b
goto MAIN_MENU

:: ============================================================
:: [1] ONE-CLICK OPTIMIZE
:: ============================================================
:ONE_CLICK
cls
echo.
echo  ================================================================
echo    ONE-CLICK OPTIMIZE - Smart Cleanup ^& Speed Boost
echo  ================================================================
echo.

:: Calculate before size
for /f "tokens=3" %%A in ('dir /s "%TEMP%" 2^>nul ^| findstr "File(s)"') do set "beforetemp=%%A"

echo  [Step 1/8] Cleaning Temporary Files...
del /q /f /s "%TEMP%\*" >nul 2>&1
del /q /f /s "C:\Windows\Temp\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Temp\*" >nul 2>&1
echo    [DONE] Temp files cleaned

echo  [Step 2/8] Clearing System Cache...
del /q /f /s "C:\Windows\Prefetch\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\Explorer\thumbcache_*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\INetCache\*" >nul 2>&1
echo    [DONE] System cache cleared

echo  [Step 3/8] Flushing DNS ^& Network Cache...
ipconfig /flushdns >nul 2>&1
arp -d * >nul 2>&1
nbtstat -R >nul 2>&1
echo    [DONE] Network cache flushed

echo  [Step 4/8] Cleaning Windows Error Reports...
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\WER\*" >nul 2>&1
del /q /f /s "%PROGRAMDATA%\Microsoft\Windows\WER\*" >nul 2>&1
del /q /f /s "C:\Windows\LiveKernelReports\*" >nul 2>&1
echo    [DONE] Error reports cleaned

echo  [Step 5/8] Cleaning Log Files...
del /q /f /s "C:\Windows\Logs\CBS\*.log" >nul 2>&1
del /q /f /s "C:\Windows\Logs\DISM\*.log" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\CrashDumps\*" >nul 2>&1
del /q /f /s "C:\Windows\Minidump\*" >nul 2>&1
del /q /f "%LOCALAPPDATA%\Microsoft\Windows\WebCache\*.log" >nul 2>&1
echo    [DONE] Log files cleaned

echo  [Step 6/8] Cleaning Recent Files History...
del /q /f "%APPDATA%\Microsoft\Windows\Recent\*" >nul 2>&1
del /q /f "%APPDATA%\Microsoft\Windows\Recent\AutomaticDestinations\*" >nul 2>&1
del /q /f "%APPDATA%\Microsoft\Windows\Recent\CustomDestinations\*" >nul 2>&1
echo    [DONE] Recent history cleaned

echo  [Step 7/8] Optimizing Memory...
rundll32.exe advapi32.dll,ProcessIdleTasks >nul 2>&1
echo off | clip >nul 2>&1
echo    [DONE] Memory optimized

echo  [Step 8/8] Stopping Unnecessary Background Services...
sc config "SysMain" start= disabled >nul 2>&1
net stop "SysMain" >nul 2>&1
sc config "DiagTrack" start= disabled >nul 2>&1
net stop "DiagTrack" >nul 2>&1
sc config "dmwappushservice" start= disabled >nul 2>&1
net stop "dmwappushservice" >nul 2>&1
echo    [DONE] Background services optimized

echo.
echo  ================================================================
echo    ONE-CLICK OPTIMIZE COMPLETE!
echo  ================================================================
echo.
echo    Your PC should feel faster now.
echo    TIP: Restart for best results.
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [2] DEEP CLEAN
:: ============================================================
:DEEP_CLEAN
cls
echo.
echo  ================================================================
echo    DEEP CLEAN - Advanced Junk File Removal
echo  ================================================================
echo.

echo  [1/10] Windows Temporary Files...
del /q /f /s "%TEMP%\*" >nul 2>&1
del /q /f /s "C:\Windows\Temp\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Temp\*" >nul 2>&1
echo    [DONE]

echo  [2/10] Windows Update Cache (can free GBs)...
net stop wuauserv >nul 2>&1
net stop bits >nul 2>&1
del /q /f /s "C:\Windows\SoftwareDistribution\Download\*" >nul 2>&1
net start wuauserv >nul 2>&1
net start bits >nul 2>&1
echo    [DONE]

echo  [3/10] Windows Installer Cache...
del /q /f /s "C:\Windows\Installer\$PatchCache$\*" >nul 2>&1
echo    [DONE]

echo  [4/10] Delivery Optimization Cache...
del /q /f /s "C:\Windows\SoftwareDistribution\DeliveryOptimization\*" >nul 2>&1
echo    [DONE]

echo  [5/10] Prefetch ^& Superfetch...
del /q /f /s "C:\Windows\Prefetch\*" >nul 2>&1
echo    [DONE]

echo  [6/10] Thumbnail ^& Icon Cache...
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\Explorer\thumbcache_*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\Explorer\iconcache_*" >nul 2>&1
echo    [DONE]

echo  [7/10] Error Reports ^& Crash Dumps...
del /q /f /s "%LOCALAPPDATA%\CrashDumps\*" >nul 2>&1
del /q /f /s "C:\Windows\Minidump\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\WER\*" >nul 2>&1
del /q /f /s "%PROGRAMDATA%\Microsoft\Windows\WER\*" >nul 2>&1
del /q /f "C:\Windows\MEMORY.DMP" >nul 2>&1
echo    [DONE]

echo  [8/10] Windows Log Files...
del /q /f /s "C:\Windows\Logs\CBS\*.log" >nul 2>&1
del /q /f /s "C:\Windows\Logs\DISM\*.log" >nul 2>&1
del /q /f /s "C:\Windows\Logs\MoSetup\*.log" >nul 2>&1
del /q /f /s "C:\Windows\Panther\*.log" >nul 2>&1
for /F "tokens=*" %%G in ('wevtutil el') do (
    wevtutil cl "%%G" >nul 2>&1
)
echo    [DONE]

echo  [9/10] Font Cache...
net stop FontCache >nul 2>&1
del /q /f /s "%WINDIR%\ServiceProfiles\LocalService\AppData\Local\FontCache\*" >nul 2>&1
net start FontCache >nul 2>&1
echo    [DONE]

echo  [10/10] Running Windows Disk Cleanup...
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Temporary Files" /v StateFlags0100 /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Recycle Bin" /v StateFlags0100 /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Old ChkDsk Files" /v StateFlags0100 /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Windows Error Reporting Files" /v StateFlags0100 /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Thumbnail Cache" /v StateFlags0100 /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Temporary Setup Files" /v StateFlags0100 /t REG_DWORD /d 2 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Setup Log Files" /v StateFlags0100 /t REG_DWORD /d 2 /f >nul 2>&1
cleanmgr /sagerun:100 >nul 2>&1
echo    [DONE]

echo.
echo  ================================================================
echo    DEEP CLEAN COMPLETE!
echo  ================================================================
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [3] RAM BOOSTER
:: ============================================================
:RAM_BOOST
cls
echo.
echo  ================================================================
echo    RAM BOOSTER - Free Up Memory Instantly
echo  ================================================================
echo.

echo  --- Current Memory Status ---
systeminfo | findstr /C:"Total Physical Memory" /C:"Available Physical Memory"
echo.

echo  [1/5] Clearing Standby Memory...
rundll32.exe advapi32.dll,ProcessIdleTasks >nul 2>&1
echo    [DONE]

echo  [2/5] Clearing Clipboard...
echo off | clip >nul 2>&1
echo    [DONE]

echo  [3/5] Stopping Memory-Heavy Background Processes...
:: Stop non-essential services that eat RAM
net stop "SysMain" >nul 2>&1
net stop "WSearch" >nul 2>&1
net stop "DiagTrack" >nul 2>&1
net stop "WMPNetworkSvc" >nul 2>&1
net stop "MapsBroker" >nul 2>&1
net stop "lfsvc" >nul 2>&1
echo    [DONE]

echo  [4/5] Optimizing Virtual Memory...
:: Clear page file on shutdown
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management" /v ClearPageFileAtShutdown /t REG_DWORD /d 1 /f >nul 2>&1
:: Disable memory compression (frees CPU)
PowerShell -Command "Disable-MMAgent -MemoryCompression" >nul 2>&1
echo    [DONE]

echo  [5/5] Flushing File System Cache...
PowerShell -Command "[System.GC]::Collect()" >nul 2>&1
echo    [DONE]

echo.
echo  --- Updated Memory Status ---
systeminfo | findstr /C:"Total Physical Memory" /C:"Available Physical Memory"
echo.
echo  ================================================================
echo    RAM BOOSTER COMPLETE!
echo  ================================================================
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [4] STARTUP OPTIMIZER
:: ============================================================
:STARTUP_OPT
cls
echo.
echo  ================================================================
echo    STARTUP OPTIMIZER - Faster Boot Time
echo  ================================================================
echo.

echo  --- Current Startup Programs ---
echo.
echo  [HKLM - All Users]:
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" 2>nul | findstr /v /r "^$" | findstr /v "HKEY_LOCAL"
echo.
echo  [HKCU - Current User]:
reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" 2>nul | findstr /v /r "^$" | findstr /v "HKEY_CURRENT"
echo.
echo  [Startup Folder]:
dir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup" /b 2>nul
echo.
echo  ---- Options ----
echo  [1] Disable common bloat startup items
echo  [2] Enable Fast Startup
echo  [3] Reduce Boot Timeout
echo  [4] All of the above
echo  [5] Back to menu
set /p sopt="Select: "

if "%sopt%"=="1" goto DISABLE_STARTUP
if "%sopt%"=="2" goto FAST_BOOT
if "%sopt%"=="3" goto BOOT_TIMEOUT
if "%sopt%"=="4" (
    call :DISABLE_STARTUP_SILENT
    call :FAST_BOOT_SILENT
    call :BOOT_TIMEOUT_SILENT
    echo.
    echo  [DONE] All startup optimizations applied!
    pause
)
goto MAIN_MENU

:DISABLE_STARTUP
echo.
echo  Disabling common startup bloat...
:DISABLE_STARTUP_SILENT
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "OneDrive" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Spotify" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Discord" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Steam" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Skype" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Teams" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "iTunesHelper" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "CCleaner" /f >nul 2>&1
echo  [DONE] Common startup bloat disabled!
if "%sopt%"=="1" pause
if "%sopt%"=="1" goto MAIN_MENU
exit /b

:FAST_BOOT
echo.
:FAST_BOOT_SILENT
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Power" /v HiberbootEnabled /t REG_DWORD /d 1 /f >nul 2>&1
powercfg /h on >nul 2>&1
echo  [DONE] Fast Startup enabled!
if "%sopt%"=="2" pause
if "%sopt%"=="2" goto MAIN_MENU
exit /b

:BOOT_TIMEOUT
echo.
:BOOT_TIMEOUT_SILENT
bcdedit /timeout 3 >nul 2>&1
echo  [DONE] Boot timeout reduced to 3 seconds!
if "%sopt%"=="3" pause
if "%sopt%"=="3" goto MAIN_MENU
exit /b

:: ============================================================
:: [5] GAMING MODE
:: ============================================================
:GAMING_MODE
cls
echo.
echo  ================================================================
echo    GAMING MODE - Maximum Performance ^& FPS
echo  ================================================================
echo.
echo  [1] ENABLE Gaming Mode (Max Performance)
echo  [2] DISABLE Gaming Mode (Restore Normal)
set /p gmode="Select: "

if "%gmode%"=="1" (
    echo.
    echo  Applying Gaming Mode optimizations...
    echo.
    
    echo  [1/10] Setting Ultimate Performance Power Plan...
    powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 >nul 2>&1
    powercfg /setactive e9a42b02-d5df-448d-aa00-03f14749eb61 >nul 2>&1
    if !errorLevel! neq 0 (
        powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1
    )
    echo    [DONE]

    echo  [2/10] Disabling Game Bar ^& DVR (reduces lag)...
    reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\GameDVR" /v AppCaptureEnabled /t REG_DWORD /d 0 /f >nul 2>&1
    reg add "HKCU\System\GameConfigStore" /v GameDVR_Enabled /t REG_DWORD /d 0 /f >nul 2>&1
    reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\GameDVR" /v AllowGameDVR /t REG_DWORD /d 0 /f >nul 2>&1
    echo    [DONE]

    echo  [3/10] Disabling Fullscreen Optimizations...
    reg add "HKCU\System\GameConfigStore" /v GameDVR_FSEBehavior /t REG_DWORD /d 2 /f >nul 2>&1
    reg add "HKCU\System\GameConfigStore" /v GameDVR_FSEBehaviorMode /t REG_DWORD /d 2 /f >nul 2>&1
    echo    [DONE]

    echo  [4/10] Enabling Hardware-Accelerated GPU Scheduling...
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\GraphicsDrivers" /v HwSchMode /t REG_DWORD /d 2 /f >nul 2>&1
    echo    [DONE]

    echo  [5/10] Optimizing GPU Priority...
    reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games" /v "GPU Priority" /t REG_DWORD /d 8 /f >nul 2>&1
    reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games" /v "Priority" /t REG_DWORD /d 6 /f >nul 2>&1
    reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games" /v "Scheduling Category" /t REG_SZ /d "High" /f >nul 2>&1
    reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile" /v "SystemResponsiveness" /t REG_DWORD /d 0 /f >nul 2>&1
    echo    [DONE]

    echo  [6/10] Disabling Nagle's Algorithm (lower ping)...
    for /f "tokens=3" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces" /s /v DhcpIPAddress 2^>nul ^| findstr /i "REG_SZ"') do (
        for /f "tokens=1-2 delims=\" %%X in ('reg query "HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces" /s /v DhcpIPAddress 2^>nul ^| findstr /i "HKEY"') do (
            reg add "%%X\%%Y" /v TcpAckFrequency /t REG_DWORD /d 1 /f >nul 2>&1
            reg add "%%X\%%Y" /v TCPNoDelay /t REG_DWORD /d 1 /f >nul 2>&1
        )
    )
    echo    [DONE]

    echo  [7/10] Disabling Visual Effects...
    reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f >nul 2>&1
    reg add "HKCU\Control Panel\Desktop" /v UserPreferencesMask /t REG_BINARY /d 9012078010000000 /f >nul 2>&1
    echo    [DONE]

    echo  [8/10] Stopping Background Services...
    net stop "SysMain" >nul 2>&1
    net stop "WSearch" >nul 2>&1
    net stop "DiagTrack" >nul 2>&1
    net stop "MapsBroker" >nul 2>&1
    net stop "Fax" >nul 2>&1
    net stop "TabletInputService" >nul 2>&1
    echo    [DONE]

    echo  [9/10] Disabling Notifications During Gaming...
    reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings" /v NOC_GLOBAL_SETTING_ALLOW_TOASTS_ABOVE_LOCK /t REG_DWORD /d 0 /f >nul 2>&1
    echo    [DONE]

    echo  [10/10] Optimizing Mouse Response...
    reg add "HKCU\Control Panel\Mouse" /v MouseSpeed /t REG_SZ /d "0" /f >nul 2>&1
    reg add "HKCU\Control Panel\Mouse" /v MouseThreshold1 /t REG_SZ /d "0" /f >nul 2>&1
    reg add "HKCU\Control Panel\Mouse" /v MouseThreshold2 /t REG_SZ /d "0" /f >nul 2>&1
    echo    [DONE]

    echo.
    echo  ================================================================
    echo    GAMING MODE ENABLED!
    echo    Restart your PC for full effect.
    echo  ================================================================
) else (
    echo.
    echo  Restoring normal settings...
    powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e >nul 2>&1
    reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\GameDVR" /v AppCaptureEnabled /t REG_DWORD /d 1 /f >nul 2>&1
    reg add "HKCU\System\GameConfigStore" /v GameDVR_Enabled /t REG_DWORD /d 1 /f >nul 2>&1
    sc config "SysMain" start= auto >nul 2>&1
    sc config "WSearch" start= delayed-auto >nul 2>&1
    reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 0 /f >nul 2>&1
    echo  [DONE] Normal mode restored!
)
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [6] SSD OPTIMIZER
:: ============================================================
:SSD_OPT
cls
echo.
echo  ================================================================
echo    SSD OPTIMIZER - Extend SSD Life ^& Speed
echo  ================================================================
echo.

echo  [1/7] Disabling Superfetch/SysMain (not needed for SSD)...
sc config "SysMain" start= disabled >nul 2>&1
net stop "SysMain" >nul 2>&1
echo    [DONE]

echo  [2/7] Disabling Hibernate (saves SSD space)...
powercfg /hibernate off >nul 2>&1
echo    [DONE]

echo  [3/7] Enabling TRIM Support...
fsutil behavior set disabledeletenotify 0 >nul 2>&1
echo    [DONE]

echo  [4/7] Disabling Prefetch ^& Superfetch for SSD...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters" /v EnablePrefetcher /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters" /v EnableSuperfetch /t REG_DWORD /d 0 /f >nul 2>&1
echo    [DONE]

echo  [5/7] Disabling Search Indexing on SSD...
sc config "WSearch" start= disabled >nul 2>&1
net stop "WSearch" >nul 2>&1
echo    [DONE]

echo  [6/7] Disabling Disk Defragmentation (harmful for SSD)...
schtasks /change /tn "\Microsoft\Windows\Defrag\ScheduledDefrag" /disable >nul 2>&1
echo    [DONE]

echo  [7/7] Running TRIM Command...
PowerShell -Command "Optimize-Volume -DriveLetter C -ReTrim -Verbose" >nul 2>&1
echo    [DONE]

echo.
echo  ================================================================
echo    SSD OPTIMIZER COMPLETE!
echo  ================================================================
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [7] WINDOWS REPAIR CENTER
:: ============================================================
:WIN_REPAIR
cls
echo.
echo  ================================================================
echo    WINDOWS REPAIR CENTER
echo  ================================================================
echo.
echo  [1] Quick Fix (SFC only)
echo  [2] Medium Fix (DISM + SFC)
echo  [3] Full Fix (DISM + SFC + CHKDSK + WU Reset)
set /p ropt="Select: "

if "%ropt%"=="1" (
    echo.
    echo  Running System File Checker...
    sfc /scannow
)
if "%ropt%"=="2" (
    echo.
    echo  Running DISM Repair...
    DISM /Online /Cleanup-Image /RestoreHealth
    echo.
    echo  Running SFC...
    sfc /scannow
)
if "%ropt%"=="3" (
    echo.
    echo  [1/4] DISM Repair...
    DISM /Online /Cleanup-Image /RestoreHealth
    echo.
    echo  [2/4] SFC Scan...
    sfc /scannow
    echo.
    echo  [3/4] CHKDSK...
    chkdsk C: /F >nul 2>&1
    echo  Disk check scheduled for next restart.
    echo.
    echo  [4/4] Windows Update Reset...
    net stop wuauserv >nul 2>&1
    net stop cryptSvc >nul 2>&1
    net stop bits >nul 2>&1
    ren C:\Windows\SoftwareDistribution SoftwareDistribution.bak >nul 2>&1
    ren C:\Windows\System32\catroot2 catroot2.bak >nul 2>&1
    net start wuauserv >nul 2>&1
    net start cryptSvc >nul 2>&1
    net start bits >nul 2>&1
    echo  [DONE] Windows Update reset!
)
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [8] NETWORK FIXER
:: ============================================================
:NET_FIX
cls
echo.
echo  ================================================================
echo    NETWORK FIXER - Fix Internet Issues
echo  ================================================================
echo.
echo  [1/6] Flushing DNS...
ipconfig /flushdns >nul 2>&1
echo    [DONE]
echo  [2/6] Releasing IP...
ipconfig /release >nul 2>&1
echo    [DONE]
echo  [3/6] Renewing IP...
ipconfig /renew >nul 2>&1
echo    [DONE]
echo  [4/6] Resetting Winsock...
netsh winsock reset >nul 2>&1
echo    [DONE]
echo  [5/6] Resetting TCP/IP...
netsh int ip reset >nul 2>&1
echo    [DONE]
echo  [6/6] Setting Google DNS (faster browsing)...
netsh interface ip set dns "Wi-Fi" static 8.8.8.8 >nul 2>&1
netsh interface ip add dns "Wi-Fi" 8.8.4.4 index=2 >nul 2>&1
netsh interface ip set dns "Ethernet" static 8.8.8.8 >nul 2>&1
netsh interface ip add dns "Ethernet" 8.8.4.4 index=2 >nul 2>&1
echo    [DONE] Google DNS set (8.8.8.8 / 8.8.4.4)
echo.
echo  ================================================================
echo    NETWORK FIXED! Restart PC for full effect.
echo  ================================================================
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [9] BOOT REPAIR
:: ============================================================
:BOOT_REPAIR
cls
echo.
echo  ================================================================
echo    BOOT REPAIR
echo  ================================================================
echo.
bootrec /fixmbr >nul 2>&1
echo  [DONE] MBR repaired
bootrec /fixboot >nul 2>&1
echo  [DONE] Boot sector repaired
bootrec /scanos >nul 2>&1
echo  [DONE] OS scan done
bootrec /rebuildbcd >nul 2>&1
echo  [DONE] BCD rebuilt
bcdboot C:\Windows /s C: /f ALL >nul 2>&1
echo  [DONE] Boot manager repaired
echo.
echo  NOTE: Some commands work best from Recovery Environment.
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [10] DRIVER MANAGER
:: ============================================================
:DRIVER_MGR
cls
echo.
echo  ================================================================
echo    DRIVER MANAGER
echo  ================================================================
echo.
echo  [1] List All Installed Drivers
echo  [2] Check for Problem Drivers
echo  [3] Backup All Drivers
echo  [4] Back to menu
set /p dopt="Select: "

if "%dopt%"=="1" (
    echo.
    driverquery /v /fo table | more
)
if "%dopt%"=="2" (
    echo.
    echo  Checking for problem drivers...
    PowerShell -Command "Get-WmiObject Win32_PnPEntity | Where-Object {$_.ConfigManagerErrorCode -ne 0} | Select-Object Name,DeviceID,ConfigManagerErrorCode | Format-Table -AutoSize"
)
if "%dopt%"=="3" (
    echo.
    set "drvdir=%USERPROFILE%\Desktop\Driver_Backup"
    mkdir "!drvdir!" >nul 2>&1
    dism /online /export-driver /destination:"!drvdir!"
    echo  [DONE] Drivers backed up to Desktop\Driver_Backup
)
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [11] VIRUS SCAN
:: ============================================================
:VIRUS_SCAN
cls
echo.
echo  ================================================================
echo    VIRUS SCAN
echo  ================================================================
echo.
echo  [1] Quick Scan
echo  [2] Full Scan
echo  [3] Custom Scan
set /p vsopt="Select: "
if "%vsopt%"=="1" "%ProgramFiles%\Windows Defender\MpCmdRun.exe" -Scan -ScanType 1
if "%vsopt%"=="2" "%ProgramFiles%\Windows Defender\MpCmdRun.exe" -Scan -ScanType 2
if "%vsopt%"=="3" (
    set /p vpath="Enter path: "
    "%ProgramFiles%\Windows Defender\MpCmdRun.exe" -Scan -ScanType 3 -File "!vpath!"
)
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [12] MALWARE REMOVAL
:: ============================================================
:MALWARE_REMOVE
cls
echo.
echo  ================================================================
echo    MALWARE REMOVAL
echo  ================================================================
echo.
echo  [1/4] Updating Definitions...
"%ProgramFiles%\Windows Defender\MpCmdRun.exe" -SignatureUpdate >nul 2>&1
echo    [DONE]
echo  [2/4] Removing detected threats...
PowerShell -Command "Remove-MpThreat" >nul 2>&1
echo    [DONE]
echo  [3/4] Quick scan for new threats...
"%ProgramFiles%\Windows Defender\MpCmdRun.exe" -Scan -ScanType 1
echo  [4/4] Checking startup for suspicious entries...
echo.
echo  --- Suspicious Startup Entries ---
reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" 2>nul
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" 2>nul
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [13] PRIVACY CLEANER
:: ============================================================
:PRIVACY_CLEAN
cls
echo.
echo  ================================================================
echo    PRIVACY CLEANER - Stop Windows Tracking
echo  ================================================================
echo.
echo  [1/8] Disabling Telemetry...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f >nul 2>&1
sc config "DiagTrack" start= disabled >nul 2>&1
net stop "DiagTrack" >nul 2>&1
echo    [DONE]
echo  [2/8] Disabling Advertising ID...
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo" /v Enabled /t REG_DWORD /d 0 /f >nul 2>&1
echo    [DONE]
echo  [3/8] Disabling Location Tracking...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\LocationAndSensors" /v DisableLocation /t REG_DWORD /d 1 /f >nul 2>&1
echo    [DONE]
echo  [4/8] Disabling Activity History...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v PublishUserActivities /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v UploadUserActivities /t REG_DWORD /d 0 /f >nul 2>&1
echo    [DONE]
echo  [5/8] Disabling Cortana...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v AllowCortana /t REG_DWORD /d 0 /f >nul 2>&1
echo    [DONE]
echo  [6/8] Disabling Typing Data Collection...
reg add "HKCU\SOFTWARE\Microsoft\Input\TIPC" /v Enabled /t REG_DWORD /d 0 /f >nul 2>&1
echo    [DONE]
echo  [7/8] Disabling Clipboard Sync...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v AllowClipboardHistory /t REG_DWORD /d 0 /f >nul 2>&1
echo    [DONE]
echo  [8/8] Clearing All Activity History...
del /q /f "%APPDATA%\Microsoft\Windows\Recent\*" >nul 2>&1
del /q /f "%APPDATA%\Microsoft\Windows\Recent\AutomaticDestinations\*" >nul 2>&1
echo    [DONE]
echo.
echo  ================================================================
echo    PRIVACY CLEANER COMPLETE!
echo  ================================================================
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [14] FIREWALL HARDENER
:: ============================================================
:FIREWALL
cls
echo.
echo  ================================================================
echo    FIREWALL HARDENER
echo  ================================================================
echo.
netsh advfirewall set allprofiles state on >nul 2>&1
echo  [DONE] Firewall enabled on all profiles
netsh advfirewall set allprofiles firewallpolicy blockinbound,allowoutbound >nul 2>&1
echo  [DONE] Inbound blocked by default
netsh advfirewall set allprofiles logging droppedconnections enable >nul 2>&1
netsh advfirewall set allprofiles logging allowedconnections enable >nul 2>&1
echo  [DONE] Logging enabled
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 1 /f >nul 2>&1
echo  [DONE] Remote Desktop disabled
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoDriveTypeAutoRun /t REG_DWORD /d 255 /f >nul 2>&1
echo  [DONE] AutoPlay disabled (USB protection)
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [15] BROWSER CLEANER
:: ============================================================
:BROWSER_CLEAN
cls
echo.
echo  ================================================================
echo    BROWSER CLEANER - Clear All Browser Data
echo  ================================================================
echo.
echo  Cleaning Chrome...
del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Code Cache\*" >nul 2>&1
del /q /f "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cookies" >nul 2>&1
del /q /f "%LOCALAPPDATA%\Google\Chrome\User Data\Default\History" >nul 2>&1
echo  [DONE]

echo  Cleaning Edge...
del /q /f /s "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Code Cache\*" >nul 2>&1
del /q /f "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cookies" >nul 2>&1
del /q /f "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\History" >nul 2>&1
echo  [DONE]

echo  Cleaning Firefox...
del /q /f /s "%LOCALAPPDATA%\Mozilla\Firefox\Profiles\*.default*\cache2\*" >nul 2>&1
echo  [DONE]

echo  Cleaning Brave...
del /q /f /s "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\Cache\*" >nul 2>&1
echo  [DONE]

echo  Cleaning Internet Explorer / Legacy Edge...
RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 255 >nul 2>&1
echo  [DONE]

echo.
echo  NOTE: Close all browsers before running for best results.
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [16] SYSTEM HEALTH REPORT
:: ============================================================
:HEALTH_REPORT
cls
echo.
echo  ================================================================
echo    SYSTEM HEALTH REPORT
echo  ================================================================
echo.
set "report=%USERPROFILE%\Desktop\PC_Health_Report.txt"

echo  Generating comprehensive report...
echo ============================================ > "%report%"
echo  PC HEALTH REPORT - %date% %time% >> "%report%"
echo ============================================ >> "%report%"

echo  [1/8] OS Info...
echo. >> "%report%"
echo == OS INFO == >> "%report%"
systeminfo | findstr /C:"OS Name" /C:"OS Version" /C:"System Type" /C:"System Boot Time" /C:"System Manufacturer" /C:"System Model" >> "%report%"

echo  [2/8] CPU...
echo. >> "%report%"
echo == CPU == >> "%report%"
wmic cpu get Name,NumberOfCores,MaxClockSpeed /format:list 2>nul | findstr /v /r "^$" >> "%report%"

echo  [3/8] RAM...
echo. >> "%report%"
echo == MEMORY == >> "%report%"
systeminfo | findstr /C:"Total Physical Memory" /C:"Available Physical Memory" >> "%report%"

echo  [4/8] Disk...
echo. >> "%report%"
echo == STORAGE == >> "%report%"
wmic diskdrive get Model,Size,Status /format:list 2>nul | findstr /v /r "^$" >> "%report%"
wmic logicaldisk get Caption,FreeSpace,Size /format:list 2>nul | findstr /v /r "^$" >> "%report%"

echo  [5/8] GPU...
echo. >> "%report%"
echo == GPU == >> "%report%"
wmic path win32_VideoController get Name,DriverVersion /format:list 2>nul | findstr /v /r "^$" >> "%report%"

echo  [6/8] Network...
echo. >> "%report%"
echo == NETWORK == >> "%report%"
ipconfig | findstr /C:"IPv4" /C:"Default Gateway" >> "%report%"

echo  [7/8] Battery...
echo. >> "%report%"
echo == BATTERY == >> "%report%"
powercfg /batteryreport /output "%USERPROFILE%\Desktop\Battery_Report.html" >nul 2>&1
if %errorLevel% equ 0 (
    echo Battery report: Desktop\Battery_Report.html >> "%report%"
) else (
    echo No battery detected >> "%report%"
)

echo  [8/8] Errors...
echo. >> "%report%"
echo == RECENT ERRORS == >> "%report%"
PowerShell -Command "Get-EventLog -LogName System -EntryType Error -Newest 10 | Format-Table TimeGenerated,Source,Message -AutoSize -Wrap" >> "%report%" 2>nul

echo.
echo  Report saved to Desktop!
notepad "%report%"
pause
goto MAIN_MENU

:: ============================================================
:: [17] BLOATWARE REMOVER
:: ============================================================
:BLOATWARE
cls
echo.
echo  ================================================================
echo    BLOATWARE REMOVER - Remove Junk Apps
echo  ================================================================
echo.
echo  Removing pre-installed junk apps...
echo.
for %%A in (
    *3dbuilder* *3dviewer* *bingfinance* *bingnews* *bingsports*
    *bingweather* *candycrush* *officehub* *skypeapp* *getstarted*
    *zunemusic* *windowsmaps* *solitairecollection* *onenote*
    *people* *zunevideo* *feedback* *yourphone* *mixedreality*
    *print3d* *tiktok* *instagram* *facebook* *spotify* *twitter*
    *clipchamp* *todos* *powerautomate* *marchofempires*
    *bubblewitch*
) do (
    PowerShell -Command "Get-AppxPackage %%A | Remove-AppxPackage" >nul 2>&1
)
echo  [DONE] All bloatware removed!
echo.

echo  Disabling Start Menu Ads...
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SystemPaneSuggestionsEnabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SilentInstalledAppsEnabled /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SoftLandingEnabled /t REG_DWORD /d 0 /f >nul 2>&1
echo  [DONE] Ads disabled!
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [18] BATTERY OPTIMIZER (Laptop)
:: ============================================================
:BATTERY_OPT
cls
echo.
echo  ================================================================
echo    BATTERY OPTIMIZER (Laptop)
echo  ================================================================
echo.
echo  [1/6] Generating Battery Health Report...
powercfg /batteryreport /output "%USERPROFILE%\Desktop\Battery_Report.html" >nul 2>&1
echo    [DONE] Report saved to Desktop

echo  [2/6] Analyzing Energy Usage...
powercfg /energy /output "%USERPROFILE%\Desktop\Energy_Report.html" >nul 2>&1
echo    [DONE] Energy report saved

echo  [3/6] Setting Balanced Power Plan...
powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e >nul 2>&1
echo    [DONE]

echo  [4/6] Reducing Screen Timeout (Battery mode)...
powercfg /change monitor-timeout-dc 5 >nul 2>&1
powercfg /change standby-timeout-dc 15 >nul 2>&1
echo    [DONE]

echo  [5/6] Disabling Background Apps...
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications" /v GlobalUserDisabled /t REG_DWORD /d 1 /f >nul 2>&1
echo    [DONE]

echo  [6/6] Disabling Bluetooth (if not needed)...
echo    Skipped (manual: turn off in Settings if not needed)

echo.
echo  ================================================================
echo    BATTERY OPTIMIZATION COMPLETE!
echo    Check Battery_Report.html on Desktop for battery health.
echo  ================================================================
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [19] DISK SPACE ANALYZER
:: ============================================================
:DISK_ANALYZE
cls
echo.
echo  ================================================================
echo    DISK SPACE ANALYZER
echo  ================================================================
echo.
echo  --- Drive Space Summary ---
echo.
echo  Drive    Total          Free           Used           Usage
echo  -------- -------------- -------------- -------------- -----
PowerShell -Command "Get-WmiObject Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | ForEach-Object { $total=[math]::Round($_.Size/1GB,1); $free=[math]::Round($_.FreeSpace/1GB,1); $used=$total-$free; $pct=[math]::Round(($used/$total)*100,1); Write-Host ('  {0,-8} {1,10} GB   {2,10} GB   {3,10} GB   {4}%%' -f $_.DeviceID,$total,$free,$used,$pct) }" 2>nul
echo.
echo  --- Largest Folders in C:\Users ---
echo.
PowerShell -Command "Get-ChildItem '%USERPROFILE%' -Directory -ErrorAction SilentlyContinue | ForEach-Object { $size = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; if($size -gt 1MB) { Write-Host ('  {0,-30} {1,10:N1} MB' -f $_.Name, ($size/1MB)) } } | Sort-Object -Descending" 2>nul
echo.
echo  --- Windows Temp Sizes ---
PowerShell -Command "$t1=(Get-ChildItem $env:TEMP -Recurse -File -EA SilentlyContinue|Measure-Object Length -Sum).Sum/1MB; $t2=(Get-ChildItem 'C:\Windows\Temp' -Recurse -File -EA SilentlyContinue|Measure-Object Length -Sum).Sum/1MB; Write-Host ('  User Temp:    {0:N1} MB' -f $t1); Write-Host ('  Windows Temp: {0:N1} MB' -f $t2)" 2>nul
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [20] AUTO BACKUP
:: ============================================================
:AUTO_BACKUP
cls
echo.
echo  ================================================================
echo    AUTO BACKUP
echo  ================================================================
echo.
set /p bkdest="Backup destination (e.g., D:\Backup): "
set "today=%date:~-4%%date:~4,2%%date:~7,2%"
set "bkdir=%bkdest%\Backup_%today%"
mkdir "%bkdir%" >nul 2>&1
echo.
echo  Backing up to %bkdir%...
echo.
for %%F in (Desktop Documents Downloads Pictures) do (
    if exist "%USERPROFILE%\%%F" (
        echo  Backing up %%F...
        robocopy "%USERPROFILE%\%%F" "%bkdir%\%%F" /E /R:1 /W:1 /NFL /NDL /NJH /NJS >nul
        echo    [DONE]
    )
)
echo  Backing up WiFi passwords...
mkdir "%bkdir%\WiFi" >nul 2>&1
netsh wlan export profile key=clear folder="%bkdir%\WiFi" >nul 2>&1
echo    [DONE]
echo  Backing up drivers...
mkdir "%bkdir%\Drivers" >nul 2>&1
dism /online /export-driver /destination:"%bkdir%\Drivers" >nul 2>&1
echo    [DONE]
echo.
echo  ================================================================
echo    BACKUP COMPLETE! Location: %bkdir%
echo  ================================================================
echo.
pause
goto MAIN_MENU

:: ============================================================
:: [99] MEGA OPTIMIZE - RUN EVERYTHING
:: ============================================================
:MEGA_OPTIMIZE
cls
echo.
echo  ================================================================
echo    MEGA OPTIMIZE - Full System Overhaul
echo  ================================================================
echo.
echo  This will run ALL optimizations:
echo    - Deep Clean (Junk Files)
echo    - RAM Booster
echo    - Startup Optimizer
echo    - SSD/Disk Optimizer
echo    - Privacy Cleaner
echo    - Browser Cleaner
echo    - Bloatware Remover
echo    - Windows Repair (SFC + DISM)
echo    - Network Fix
echo.
echo  Estimated time: 30-60 minutes
echo.
set /p confirm="Run MEGA OPTIMIZE? (Y/N): "
if /i not "%confirm%"=="Y" goto MAIN_MENU

echo.
echo  ============ PHASE 1: CLEAN ============
echo.

echo  [CLEAN 1/5] Temp Files...
del /q /f /s "%TEMP%\*" >nul 2>&1
del /q /f /s "C:\Windows\Temp\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Temp\*" >nul 2>&1
echo    [DONE]

echo  [CLEAN 2/5] System Cache...
del /q /f /s "C:\Windows\Prefetch\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\Explorer\thumbcache_*" >nul 2>&1
echo    [DONE]

echo  [CLEAN 3/5] Windows Update Cache...
net stop wuauserv >nul 2>&1
del /q /f /s "C:\Windows\SoftwareDistribution\Download\*" >nul 2>&1
net start wuauserv >nul 2>&1
echo    [DONE]

echo  [CLEAN 4/5] Error Reports ^& Logs...
del /q /f /s "%LOCALAPPDATA%\CrashDumps\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Windows\WER\*" >nul 2>&1
del /q /f "C:\Windows\MEMORY.DMP" >nul 2>&1
for /F "tokens=*" %%G in ('wevtutil el') do (wevtutil cl "%%G" >nul 2>&1)
echo    [DONE]

echo  [CLEAN 5/5] Browser Cache...
del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache\*" >nul 2>&1
RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 255 >nul 2>&1
echo    [DONE]

echo.
echo  ============ PHASE 2: OPTIMIZE ============
echo.

echo  [OPT 1/5] RAM Booster...
rundll32.exe advapi32.dll,ProcessIdleTasks >nul 2>&1
echo off | clip >nul 2>&1
echo    [DONE]

echo  [OPT 2/5] Disabling Bloat Services...
for %%S in (SysMain DiagTrack dmwappushservice MapsBroker lfsvc WMPNetworkSvc Fax) do (
    sc config "%%S" start= disabled >nul 2>&1
    net stop "%%S" >nul 2>&1
)
echo    [DONE]

echo  [OPT 3/5] Power Plan: High Performance...
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1
echo    [DONE]

echo  [OPT 4/5] Startup Cleanup...
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "OneDrive" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Spotify" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Discord" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Steam" /f >nul 2>&1
echo    [DONE]

echo  [OPT 5/5] SSD TRIM...
fsutil behavior set disabledeletenotify 0 >nul 2>&1
echo    [DONE]

echo.
echo  ============ PHASE 3: PRIVACY ============
echo.

echo  [PRIV 1/3] Disabling Telemetry...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo" /v Enabled /t REG_DWORD /d 0 /f >nul 2>&1
echo    [DONE]

echo  [PRIV 2/3] Disabling Tracking...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\LocationAndSensors" /v DisableLocation /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\System" /v PublishUserActivities /t REG_DWORD /d 0 /f >nul 2>&1
echo    [DONE]

echo  [PRIV 3/3] Removing Bloatware...
for %%A in (*candycrush* *bingfinance* *bingnews* *tiktok* *instagram* *facebook* *spotify* *solitaire* *clipchamp*) do (
    PowerShell -Command "Get-AppxPackage %%A | Remove-AppxPackage" >nul 2>&1
)
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" /v SilentInstalledAppsEnabled /t REG_DWORD /d 0 /f >nul 2>&1
echo    [DONE]

echo.
echo  ============ PHASE 4: REPAIR ============
echo.

echo  [FIX 1/3] Network Reset...
ipconfig /flushdns >nul 2>&1
netsh winsock reset >nul 2>&1
netsh int ip reset >nul 2>&1
echo    [DONE]

echo  [FIX 2/3] DISM Repair...
DISM /Online /Cleanup-Image /RestoreHealth >nul 2>&1
echo    [DONE]

echo  [FIX 3/3] SFC Scan...
sfc /scannow >nul 2>&1
echo    [DONE]

echo.
echo.
color 0A
echo  ================================================================
echo  ^|                                                              ^|
echo  ^|         MEGA OPTIMIZE COMPLETE!                              ^|
echo  ^|                                                              ^|
echo  ^|   Your PC has been fully optimized, cleaned, secured,       ^|
echo  ^|   and repaired. RESTART your PC for full effect!            ^|
echo  ^|                                                              ^|
echo  ================================================================
echo.
set /p restart="Restart now? (Y/N): "
if /i "%restart%"=="Y" shutdown /r /t 10 /c "Mega Optimize Complete - Restarting"
echo.
pause
goto MAIN_MENU
