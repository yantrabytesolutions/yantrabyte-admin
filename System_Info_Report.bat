@echo off
:: ============================================================
::  SYSTEM INFO REPORTER - Full PC Health Report
::  Run as Administrator for complete info
:: ============================================================
title System Info Reporter
color 0B
mode con: cols=75 lines=45

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo   ERROR: Run as Administrator for full report!
    echo   Some info may be limited...
    echo.
)

set "report=%USERPROFILE%\Desktop\PC_Health_Report.txt"

echo =========================================================
echo          SYSTEM INFO REPORTER
echo =========================================================
echo.
echo  Generating full PC health report...
echo  This will be saved to your Desktop.
echo.

:: Start report
echo ============================================== > "%report%"
echo   PC HEALTH REPORT >> "%report%"
echo   Generated: %date% %time% >> "%report%"
echo ============================================== >> "%report%"

:: ---- OS Info ----
echo.
echo  [1/10] Collecting OS Information...
echo. >> "%report%"
echo ====== OPERATING SYSTEM ====== >> "%report%"
systeminfo | findstr /C:"OS Name" /C:"OS Version" /C:"System Type" /C:"Original Install Date" /C:"System Boot Time" /C:"System Manufacturer" /C:"System Model" >> "%report%"

:: ---- CPU Info ----
echo  [2/10] Collecting CPU Information...
echo. >> "%report%"
echo ====== PROCESSOR (CPU) ====== >> "%report%"
wmic cpu get Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed /format:list 2>nul | findstr /v /r "^$" >> "%report%"

:: ---- RAM Info ----
echo  [3/10] Collecting RAM Information...
echo. >> "%report%"
echo ====== MEMORY (RAM) ====== >> "%report%"
systeminfo | findstr /C:"Total Physical Memory" /C:"Available Physical Memory" /C:"Virtual Memory" >> "%report%"
echo. >> "%report%"
echo -- RAM Modules -- >> "%report%"
wmic memorychip get Capacity,Speed,Manufacturer,PartNumber /format:list 2>nul | findstr /v /r "^$" >> "%report%"

:: ---- Disk Info ----
echo  [4/10] Collecting Disk Information...
echo. >> "%report%"
echo ====== STORAGE (DISK) ====== >> "%report%"
echo -- Drive Status -- >> "%report%"
wmic diskdrive get Model,Size,Status,MediaType /format:list 2>nul | findstr /v /r "^$" >> "%report%"
echo. >> "%report%"
echo -- Partitions -- >> "%report%"
wmic logicaldisk get Caption,Description,FileSystem,FreeSpace,Size,VolumeName /format:list 2>nul | findstr /v /r "^$" >> "%report%"

:: ---- GPU Info ----
echo  [5/10] Collecting GPU Information...
echo. >> "%report%"
echo ====== GRAPHICS (GPU) ====== >> "%report%"
wmic path win32_VideoController get Name,AdapterRAM,DriverVersion,VideoProcessor /format:list 2>nul | findstr /v /r "^$" >> "%report%"

:: ---- Network Info ----
echo  [6/10] Collecting Network Information...
echo. >> "%report%"
echo ====== NETWORK ====== >> "%report%"
ipconfig | findstr /C:"IPv4" /C:"Subnet" /C:"Default Gateway" /C:"DNS" /C:"Adapter" >> "%report%"

:: ---- Battery Info (Laptop) ----
echo  [7/10] Checking Battery Health...
echo. >> "%report%"
echo ====== BATTERY (Laptop Only) ====== >> "%report%"
powercfg /batteryreport /output "%USERPROFILE%\Desktop\Battery_Report.html" >nul 2>&1
if %errorLevel% equ 0 (
    echo Battery report saved to: Desktop\Battery_Report.html >> "%report%"
) else (
    echo No battery detected (Desktop PC) >> "%report%"
)

:: ---- Startup Programs ----
echo  [8/10] Listing Startup Programs...
echo. >> "%report%"
echo ====== STARTUP PROGRAMS ====== >> "%report%"
wmic startup get Caption,Command /format:list 2>nul | findstr /v /r "^$" >> "%report%"

:: ---- Installed Programs ----
echo  [9/10] Listing Installed Programs...
echo. >> "%report%"
echo ====== INSTALLED PROGRAMS ====== >> "%report%"
wmic product get Name,Version /format:list 2>nul | findstr /v /r "^$" >> "%report%"

:: ---- Recent Errors ----
echo  [10/10] Checking Recent Errors...
echo. >> "%report%"
echo ====== RECENT SYSTEM ERRORS (Last 10) ====== >> "%report%"
PowerShell -Command "Get-EventLog -LogName System -EntryType Error -Newest 10 | Format-Table TimeGenerated,Source,Message -AutoSize -Wrap" >> "%report%" 2>nul

:: ---- Temperature (if available) ----
echo. >> "%report%"
echo ====== TEMPERATURES ====== >> "%report%"
PowerShell -Command "Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace root/wmi 2>$null | ForEach-Object { 'Temperature: ' + (($_.CurrentTemperature - 2732) / 10) + ' C' }" >> "%report%" 2>nul

:: ---- Uptime ----
echo. >> "%report%"
echo ====== SYSTEM UPTIME ====== >> "%report%"
systeminfo | findstr /C:"System Boot Time" >> "%report%"
net statistics workstation | findstr /C:"Statistics since" >> "%report%"

echo. >> "%report%"
echo ============================================== >> "%report%"
echo   END OF REPORT >> "%report%"
echo ============================================== >> "%report%"

echo.
echo =========================================================
echo  REPORT GENERATED SUCCESSFULLY!
echo =========================================================
echo.
echo  Saved to: %report%
echo.
echo  Opening report now...
notepad "%report%"
echo.
pause
