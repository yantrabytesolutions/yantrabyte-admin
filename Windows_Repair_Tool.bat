@echo off
:: ============================================================
::  WINDOWS REPAIR TOOL - Check & Fix Without Formatting
::  Run as Administrator
:: ============================================================
title Windows Repair Tool - Check and Fix
color 0B
mode con: cols=75 lines=45

:: Check for Admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo ================================================
    echo   ERROR: Please Run as Administrator!
    echo ================================================
    echo.
    echo   Right-click this file and select
    echo   "Run as administrator"
    echo.
    pause
    exit /b
)

:MENU
cls
color 0B
echo =========================================================
echo          WINDOWS REPAIR TOOL - No Format Needed
echo =========================================================
echo.
echo   [1]  Quick Scan     (SFC - Fix Corrupted System Files)
echo   [2]  Deep Scan      (DISM - Repair Windows Image)
echo   [3]  Disk Check     (CHKDSK - Fix Disk Errors)
echo   [4]  Boot Repair    (Fix Startup/Boot Issues)
echo   [5]  Reset Network  (Fix Internet/WiFi Issues)
echo   [6]  Reset Windows Update (Fix Update Errors)
echo   [7]  Fix Windows Services (Re-register DLLs)
echo   [8]  Disk Health    (Check SSD/HDD Health)
echo   [9]  Memory Test    (Check RAM for Errors)
echo   [10] Component Cleanup (Free Space + Fix Store)
echo   [11] Reset Windows Store (Fix App Issues)
echo   [12] Full System Repair (Run Steps 1+2+3+6+7+10)
echo.
echo   [0]  Exit
echo.
echo =========================================================
set /p choice="Select an option (0-12): "

if "%choice%"=="1" goto SFC_SCAN
if "%choice%"=="2" goto DISM_SCAN
if "%choice%"=="3" goto CHKDSK_SCAN
if "%choice%"=="4" goto BOOT_REPAIR
if "%choice%"=="5" goto NETWORK_RESET
if "%choice%"=="6" goto WUPDATE_RESET
if "%choice%"=="7" goto FIX_SERVICES
if "%choice%"=="8" goto DISK_HEALTH
if "%choice%"=="9" goto MEMORY_TEST
if "%choice%"=="10" goto COMPONENT_CLEANUP
if "%choice%"=="11" goto STORE_RESET
if "%choice%"=="12" goto FULL_REPAIR
if "%choice%"=="0" goto EXIT
echo Invalid choice. Try again.
timeout /t 2 >nul
goto MENU

:: ============================================================
:: [1] SFC SCAN - System File Checker
:: ============================================================
:SFC_SCAN
cls
echo =========================================================
echo  [1] SFC SCAN - Checking System Files...
echo =========================================================
echo.
echo  This scans all protected Windows system files and
echo  replaces corrupted files with a cached copy.
echo.
echo  Please wait... This may take 10-15 minutes.
echo.
sfc /scannow
echo.
echo =========================================================
echo  SFC Scan Complete!
echo =========================================================
echo.
echo  If it says "found corrupt files but was unable to fix",
echo  run Option [2] DISM Scan next.
echo.
pause
goto MENU

:: ============================================================
:: [2] DISM SCAN - Repair Windows Image
:: ============================================================
:DISM_SCAN
cls
echo =========================================================
echo  [2] DISM SCAN - Repairing Windows Image...
echo =========================================================
echo.
echo  Step 1/3: Checking Health...
echo.
DISM /Online /Cleanup-Image /CheckHealth
echo.
echo  Step 2/3: Scanning Health...
echo.
DISM /Online /Cleanup-Image /ScanHealth
echo.
echo  Step 3/3: Restoring Health (downloading fixes)...
echo  This may take 15-30 minutes. Please be patient.
echo.
DISM /Online /Cleanup-Image /RestoreHealth
echo.
echo =========================================================
echo  DISM Repair Complete!
echo =========================================================
echo.
echo  RECOMMENDATION: Now run Option [1] SFC Scan again
echo  to verify all files are fixed.
echo.
pause
goto MENU

:: ============================================================
:: [3] CHKDSK - Check Disk for Errors
:: ============================================================
:CHKDSK_SCAN
cls
echo =========================================================
echo  [3] CHKDSK - Checking Disk for Errors...
echo =========================================================
echo.
echo  This checks your hard drive for file system errors
echo  and bad sectors, and attempts to fix them.
echo.
echo  NOTE: Full scan requires a restart. The scan will
echo  run before Windows starts next time.
echo.
set /p dsk="Enter drive letter to check (e.g., C): "
echo.
echo  Running quick check on %dsk%: drive...
echo.
chkdsk %dsk%: /F /R /X
echo.
if %errorLevel% neq 0 (
    echo.
    echo  Drive is in use. Schedule check on next restart?
    set /p schedchk="  (Y/N): "
    if /i "!schedchk!"=="Y" (
        echo Y | chkdsk %dsk%: /F /R /X
        echo.
        echo  CHKDSK scheduled for next restart.
    )
)
echo.
echo =========================================================
echo  Disk Check Complete!
echo =========================================================
echo.
pause
goto MENU

:: ============================================================
:: [4] BOOT REPAIR - Fix Startup Issues
:: ============================================================
:BOOT_REPAIR
cls
echo =========================================================
echo  [4] BOOT REPAIR - Fixing Startup Issues...
echo =========================================================
echo.
echo  Repairing Master Boot Record...
bootrec /fixmbr >nul 2>&1
echo  [DONE] MBR repaired.
echo.
echo  Repairing Boot Sector...
bootrec /fixboot >nul 2>&1
echo  [DONE] Boot sector repaired.
echo.
echo  Scanning for Windows installations...
bootrec /scanos >nul 2>&1
echo  [DONE] OS scan complete.
echo.
echo  Rebuilding Boot Configuration Data (BCD)...
bootrec /rebuildbcd >nul 2>&1
echo  [DONE] BCD rebuilt.
echo.
echo  Repairing Boot Manager...
bcdboot C:\Windows /s C: /f ALL >nul 2>&1
echo  [DONE] Boot manager repaired.
echo.
echo =========================================================
echo  Boot Repair Complete!
echo =========================================================
echo.
echo  NOTE: Some boot commands may only work from
echo  Windows Recovery Environment (WinRE).
echo  Restart your PC to see the effect.
echo.
pause
goto MENU

:: ============================================================
:: [5] NETWORK RESET - Fix Internet Issues
:: ============================================================
:NETWORK_RESET
cls
echo =========================================================
echo  [5] NETWORK RESET - Fixing Internet Issues...
echo =========================================================
echo.
echo  Flushing DNS Cache...
ipconfig /flushdns
echo  [DONE]
echo.
echo  Releasing IP Address...
ipconfig /release >nul 2>&1
echo  [DONE]
echo.
echo  Renewing IP Address...
ipconfig /renew >nul 2>&1
echo  [DONE]
echo.
echo  Resetting Winsock Catalog...
netsh winsock reset >nul 2>&1
echo  [DONE]
echo.
echo  Resetting TCP/IP Stack...
netsh int ip reset >nul 2>&1
echo  [DONE]
echo.
echo  Resetting Firewall to defaults...
netsh advfirewall reset >nul 2>&1
echo  [DONE]
echo.
echo  Clearing ARP Cache...
netsh interface ip delete arpcache >nul 2>&1
arp -d * >nul 2>&1
echo  [DONE]
echo.
echo  Resetting Proxy Settings...
netsh winhttp reset proxy >nul 2>&1
echo  [DONE]
echo.
echo =========================================================
echo  Network Reset Complete!
echo =========================================================
echo.
echo  Please RESTART your PC for changes to take effect.
echo.
pause
goto MENU

:: ============================================================
:: [6] RESET WINDOWS UPDATE
:: ============================================================
:WUPDATE_RESET
cls
echo =========================================================
echo  [6] RESETTING WINDOWS UPDATE...
echo =========================================================
echo.
echo  Stopping Windows Update services...
net stop wuauserv >nul 2>&1
net stop cryptSvc >nul 2>&1
net stop bits >nul 2>&1
net stop msiserver >nul 2>&1
net stop appidsvc >nul 2>&1
echo  [DONE] Services stopped.
echo.
echo  Renaming update cache folders...
ren C:\Windows\SoftwareDistribution SoftwareDistribution.bak >nul 2>&1
ren C:\Windows\System32\catroot2 catroot2.bak >nul 2>&1
echo  [DONE] Cache folders renamed.
echo.
echo  Resetting BITS and WU to default security...
sc sdset bits D:(A;;CCLCSWRPWPDTLOCRRC;;;SY)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)(A;;CCLCSWLOCRRC;;;AU)(A;;CCLCSWRPWPDTLOCRRC;;;PU) >nul 2>&1
sc sdset wuauserv D:(A;;CCLCSWRPWPDTLOCRRC;;;SY)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)(A;;CCLCSWLOCRRC;;;AU)(A;;CCLCSWRPWPDTLOCRRC;;;PU) >nul 2>&1
echo  [DONE] Security descriptors reset.
echo.
echo  Re-registering Windows Update DLLs...
regsvr32.exe /s atl.dll
regsvr32.exe /s urlmon.dll
regsvr32.exe /s mshtml.dll
regsvr32.exe /s shdocvw.dll
regsvr32.exe /s browseui.dll
regsvr32.exe /s jscript.dll
regsvr32.exe /s vbscript.dll
regsvr32.exe /s scrrun.dll
regsvr32.exe /s msxml.dll
regsvr32.exe /s msxml3.dll
regsvr32.exe /s msxml6.dll
regsvr32.exe /s actxprxy.dll
regsvr32.exe /s softpub.dll
regsvr32.exe /s wintrust.dll
regsvr32.exe /s dssenh.dll
regsvr32.exe /s rsaenh.dll
regsvr32.exe /s gpkcsp.dll
regsvr32.exe /s sccbase.dll
regsvr32.exe /s slbcsp.dll
regsvr32.exe /s cryptdlg.dll
regsvr32.exe /s oleaut32.dll
regsvr32.exe /s ole32.dll
regsvr32.exe /s shell32.dll
regsvr32.exe /s initpki.dll
regsvr32.exe /s wuapi.dll
regsvr32.exe /s wuaueng.dll
regsvr32.exe /s wuaueng1.dll
regsvr32.exe /s wucltui.dll
regsvr32.exe /s wups.dll
regsvr32.exe /s wups2.dll
regsvr32.exe /s wuweb.dll
regsvr32.exe /s qmgr.dll
regsvr32.exe /s qmgrprxy.dll
regsvr32.exe /s wucltux.dll
regsvr32.exe /s muweb.dll
regsvr32.exe /s wuwebv.dll
echo  [DONE] DLLs re-registered.
echo.
echo  Starting Windows Update services...
net start wuauserv >nul 2>&1
net start cryptSvc >nul 2>&1
net start bits >nul 2>&1
net start msiserver >nul 2>&1
net start appidsvc >nul 2>&1
echo  [DONE] Services restarted.
echo.
echo =========================================================
echo  Windows Update Reset Complete!
echo =========================================================
echo.
echo  Try running Windows Update again now.
echo.
pause
goto MENU

:: ============================================================
:: [7] FIX WINDOWS SERVICES - Re-register System DLLs
:: ============================================================
:FIX_SERVICES
cls
echo =========================================================
echo  [7] FIXING WINDOWS SERVICES...
echo =========================================================
echo.
echo  Re-registering all system DLL files...
echo  This fixes common errors like missing DLLs,
echo  application crashes, and service failures.
echo.
for %%i in (
    atl.dll urlmon.dll mshtml.dll shdocvw.dll browseui.dll
    jscript.dll vbscript.dll scrrun.dll msxml.dll msxml3.dll
    msxml6.dll actxprxy.dll softpub.dll wintrust.dll dssenh.dll
    rsaenh.dll gpkcsp.dll sccbase.dll slbcsp.dll cryptdlg.dll
    oleaut32.dll ole32.dll shell32.dll wuapi.dll wuaueng.dll
    wups.dll wups2.dll qmgr.dll qmgrprxy.dll muweb.dll
    wucltux.dll wuwebv.dll
) do (
    regsvr32.exe /s %%i >nul 2>&1
)
echo  [DONE] DLLs re-registered.
echo.
echo  Resetting Windows Installer service...
msiexec /unregister >nul 2>&1
msiexec /regserver >nul 2>&1
echo  [DONE] Windows Installer reset.
echo.
echo  Resetting Print Spooler...
net stop spooler >nul 2>&1
del /q /f /s "%systemroot%\System32\spool\PRINTERS\*" >nul 2>&1
net start spooler >nul 2>&1
echo  [DONE] Print Spooler reset.
echo.
echo =========================================================
echo  Windows Services Fix Complete!
echo =========================================================
echo.
pause
goto MENU

:: ============================================================
:: [8] DISK HEALTH - Check SSD/HDD Health
:: ============================================================
:DISK_HEALTH
cls
echo =========================================================
echo  [8] DISK HEALTH CHECK
echo =========================================================
echo.
echo  ---- Drive Information ----
echo.
wmic diskdrive get model,size,status,mediaType 2>nul
echo.
echo  ---- Disk Partitions ----
echo.
wmic logicaldisk get caption,description,freespace,size,volumename 2>nul
echo.
echo  ---- SMART Status ----
echo.
wmic diskdrive get model,status 2>nul
echo.
echo  ---- File System Info ----
echo.
fsutil fsinfo drives
echo.
echo =========================================================
echo  Disk Health Check Complete!
echo =========================================================
echo.
echo  Status "OK" = Drive is healthy
echo  Status "Pred Fail" = Drive is failing! Backup NOW!
echo.
pause
goto MENU

:: ============================================================
:: [9] MEMORY TEST - Check RAM
:: ============================================================
:MEMORY_TEST
cls
echo =========================================================
echo  [9] MEMORY TEST - Check RAM for Errors
echo =========================================================
echo.
echo  ---- Current Memory Info ----
echo.
systeminfo | findstr /C:"Total Physical Memory" /C:"Available Physical Memory"
echo.
echo  Windows Memory Diagnostic will restart your PC
echo  and test your RAM for errors.
echo.
set /p memtest="Schedule Memory Test on next restart? (Y/N): "
if /i "%memtest%"=="Y" (
    mdsched.exe
) else (
    echo  Memory test skipped.
)
echo.
pause
goto MENU

:: ============================================================
:: [10] COMPONENT CLEANUP
:: ============================================================
:COMPONENT_CLEANUP
cls
echo =========================================================
echo  [10] COMPONENT STORE CLEANUP
echo =========================================================
echo.
echo  Cleaning up superseded components...
echo  This frees up disk space and fixes component store.
echo.
DISM /Online /Cleanup-Image /StartComponentCleanup
echo.
echo  Removing old service pack backup files...
DISM /Online /Cleanup-Image /SPSuperseded >nul 2>&1
echo.
echo  Analyzing component store size...
DISM /Online /Cleanup-Image /AnalyzeComponentStore
echo.
echo =========================================================
echo  Component Cleanup Complete!
echo =========================================================
echo.
pause
goto MENU

:: ============================================================
:: [11] RESET WINDOWS STORE
:: ============================================================
:STORE_RESET
cls
echo =========================================================
echo  [11] RESETTING WINDOWS STORE
echo =========================================================
echo.
echo  Clearing Windows Store cache...
wsreset.exe >nul 2>&1
echo  [DONE] Store cache cleared.
echo.
echo  Re-registering all Windows Store apps...
PowerShell -ExecutionPolicy Unrestricted -Command "& {Get-AppXPackage -AllUsers | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register \"$($_.InstallLocation)\AppXManifest.xml\" -ErrorAction SilentlyContinue}}" >nul 2>&1
echo  [DONE] Store apps re-registered.
echo.
echo  Re-registering Windows Store itself...
PowerShell -ExecutionPolicy Unrestricted -Command "& {Get-AppXPackage *WindowsStore* -AllUsers | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register \"$($_.InstallLocation)\AppXManifest.xml\" -ErrorAction SilentlyContinue}}" >nul 2>&1
echo  [DONE] Windows Store re-registered.
echo.
echo =========================================================
echo  Windows Store Reset Complete!
echo =========================================================
echo.
pause
goto MENU

:: ============================================================
:: [12] FULL SYSTEM REPAIR - All Major Fixes
:: ============================================================
:FULL_REPAIR
cls
echo =========================================================
echo  [12] FULL SYSTEM REPAIR
echo =========================================================
echo.
echo  This will run a complete repair sequence:
echo    DISM -> SFC -> CHKDSK -> WU Reset -> DLL Fix -> Cleanup
echo.
echo  This may take 30-60 minutes. Do NOT close this window.
echo.
set /p fullconfirm="Continue with Full Repair? (Y/N): "
if /i not "%fullconfirm%"=="Y" goto MENU

echo.
echo =========================================================
echo  Step 1/6: DISM - Repairing Windows Image...
echo =========================================================
DISM /Online /Cleanup-Image /RestoreHealth
echo.

echo =========================================================
echo  Step 2/6: SFC - Scanning System Files...
echo =========================================================
sfc /scannow
echo.

echo =========================================================
echo  Step 3/6: CHKDSK - Quick Disk Check on C:...
echo =========================================================
chkdsk C: /F >nul 2>&1
echo  [DONE] Disk checked (full scan on next restart).
echo.

echo =========================================================
echo  Step 4/6: Resetting Windows Update...
echo =========================================================
net stop wuauserv >nul 2>&1
net stop cryptSvc >nul 2>&1
net stop bits >nul 2>&1
net stop msiserver >nul 2>&1
ren C:\Windows\SoftwareDistribution SoftwareDistribution.bak >nul 2>&1
ren C:\Windows\System32\catroot2 catroot2.bak >nul 2>&1
net start wuauserv >nul 2>&1
net start cryptSvc >nul 2>&1
net start bits >nul 2>&1
net start msiserver >nul 2>&1
echo  [DONE] Windows Update reset.
echo.

echo =========================================================
echo  Step 5/6: Re-registering System DLLs...
echo =========================================================
for %%i in (
    atl.dll urlmon.dll mshtml.dll shdocvw.dll browseui.dll
    jscript.dll vbscript.dll scrrun.dll msxml.dll msxml3.dll
    msxml6.dll actxprxy.dll softpub.dll wintrust.dll dssenh.dll
    oleaut32.dll ole32.dll shell32.dll wuapi.dll wuaueng.dll
    wups.dll wups2.dll qmgr.dll qmgrprxy.dll
) do (
    regsvr32.exe /s %%i >nul 2>&1
)
echo  [DONE] DLLs re-registered.
echo.

echo =========================================================
echo  Step 6/6: Component Store Cleanup...
echo =========================================================
DISM /Online /Cleanup-Image /StartComponentCleanup >nul 2>&1
echo  [DONE] Component store cleaned.
echo.

echo.
color 0A
echo =========================================================
echo       FULL SYSTEM REPAIR COMPLETED!
echo =========================================================
echo.
echo  All major repairs have been performed.
echo  Please RESTART your PC for all changes to take effect.
echo.
echo  If issues persist after restart:
echo    - Run this tool again with specific options
echo    - Check Event Viewer for error details
echo    - Consider Windows Reset (keeps your files)
echo.
echo =========================================================
echo.
set /p restart="Restart now? (Y/N): "
if /i "%restart%"=="Y" (
    shutdown /r /t 10 /c "Windows Repair - Restarting"
)
pause
goto MENU

:: ============================================================
:: EXIT
:: ============================================================
:EXIT
cls
echo.
echo  Thank you for using Windows Repair Tool!
echo  Restart your PC if you made any changes.
echo.
timeout /t 3
exit /b
