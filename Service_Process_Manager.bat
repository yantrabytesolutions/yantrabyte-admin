@echo off
:: ============================================================
::  SERVICE ^& PROCESS MANAGER - SysAdmin Tool
::  Run as Administrator
:: ============================================================
title Service ^& Process Manager
color 0B
mode con: cols=80 lines=45
setlocal enabledelayedexpansion

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo   ERROR: Run as Administrator!
    pause
    exit /b
)

:MENU
cls
echo ===========================================================
echo          SERVICE ^& PROCESS MANAGER
echo ===========================================================
echo.
echo   --- Service Management ---
echo   [1]  List All Running Services
echo   [2]  List All Stopped Services
echo   [3]  Search for a Service
echo   [4]  Start a Service
echo   [5]  Stop a Service
echo   [6]  Restart a Service
echo   [7]  Set Service Startup Type
echo   [8]  View Service Details
echo.
echo   --- Process Management ---
echo   [9]  List All Running Processes (by CPU)
echo   [10] List Top 20 Memory-Hungry Processes
echo   [11] Kill a Process by Name
echo   [12] Kill a Process by PID
echo   [13] Find Which Process Uses a Port
echo.
echo   --- Task Scheduler ---
echo   [14] List Scheduled Tasks
echo   [15] Create a Scheduled Task
echo   [16] Delete a Scheduled Task
echo.
echo   [0]  Exit
echo.
echo ===========================================================
set /p choice="Select an option (0-16): "

if "%choice%"=="1" goto RUNNING_SVC
if "%choice%"=="2" goto STOPPED_SVC
if "%choice%"=="3" goto SEARCH_SVC
if "%choice%"=="4" goto START_SVC
if "%choice%"=="5" goto STOP_SVC
if "%choice%"=="6" goto RESTART_SVC
if "%choice%"=="7" goto SET_STARTUP
if "%choice%"=="8" goto SVC_DETAILS
if "%choice%"=="9" goto LIST_PROC
if "%choice%"=="10" goto TOP_MEMORY
if "%choice%"=="11" goto KILL_NAME
if "%choice%"=="12" goto KILL_PID
if "%choice%"=="13" goto PORT_PROCESS
if "%choice%"=="14" goto LIST_TASKS
if "%choice%"=="15" goto CREATE_TASK
if "%choice%"=="16" goto DELETE_TASK
if "%choice%"=="0" exit /b
goto MENU

:RUNNING_SVC
cls
echo ===========================================================
echo  [1] ALL RUNNING SERVICES
echo ===========================================================
echo.
sc query state= active | findstr /C:"SERVICE_NAME" /C:"DISPLAY_NAME" /C:"STATE"
echo.
echo  Total Running:
sc query state= active | findstr /C:"SERVICE_NAME" | find /c /v ""
echo.
pause
goto MENU

:STOPPED_SVC
cls
echo ===========================================================
echo  [2] ALL STOPPED SERVICES
echo ===========================================================
echo.
sc query state= inactive | findstr /C:"SERVICE_NAME" /C:"DISPLAY_NAME" /C:"STATE"
echo.
pause
goto MENU

:SEARCH_SVC
cls
echo ===========================================================
echo  [3] SEARCH FOR A SERVICE
echo ===========================================================
echo.
set /p keyword="Enter service name keyword: "
echo.
echo  Matching Services:
echo  --------------------------------------------------
sc query state= all | findstr /i /C:"%keyword%"
echo.
pause
goto MENU

:START_SVC
cls
echo ===========================================================
echo  [4] START A SERVICE
echo ===========================================================
echo.
set /p svcname="Enter Service Name: "
echo.
echo  Starting %svcname%...
net start "%svcname%"
echo.
pause
goto MENU

:STOP_SVC
cls
echo ===========================================================
echo  [5] STOP A SERVICE
echo ===========================================================
echo.
set /p svcname="Enter Service Name: "
echo.
echo  Stopping %svcname%...
net stop "%svcname%"
echo.
pause
goto MENU

:RESTART_SVC
cls
echo ===========================================================
echo  [6] RESTART A SERVICE
echo ===========================================================
echo.
set /p svcname="Enter Service Name: "
echo.
echo  Stopping %svcname%...
net stop "%svcname%" >nul 2>&1
timeout /t 2 >nul
echo  Starting %svcname%...
net start "%svcname%"
echo.
echo  [DONE] Service restarted!
echo.
pause
goto MENU

:SET_STARTUP
cls
echo ===========================================================
echo  [7] SET SERVICE STARTUP TYPE
echo ===========================================================
echo.
set /p svcname="Enter Service Name: "
echo.
echo  [1] Automatic
echo  [2] Automatic (Delayed Start)
echo  [3] Manual
echo  [4] Disabled
set /p stype="Select startup type (1-4): "
if "%stype%"=="1" sc config "%svcname%" start= auto
if "%stype%"=="2" sc config "%svcname%" start= delayed-auto
if "%stype%"=="3" sc config "%svcname%" start= demand
if "%stype%"=="4" sc config "%svcname%" start= disabled
echo.
echo  [DONE] Startup type changed!
echo.
pause
goto MENU

:SVC_DETAILS
cls
echo ===========================================================
echo  [8] SERVICE DETAILS
echo ===========================================================
echo.
set /p svcname="Enter Service Name: "
echo.
sc qc "%svcname%"
echo.
echo  --- Current Status ---
sc query "%svcname%"
echo.
pause
goto MENU

:LIST_PROC
cls
echo ===========================================================
echo  [9] ALL RUNNING PROCESSES (sorted by CPU)
echo ===========================================================
echo.
PowerShell -Command "Get-Process | Sort-Object CPU -Descending | Select-Object -First 30 Name,Id,CPU,@{N='Memory(MB)';E={[math]::Round($_.WorkingSet64/1MB,1)}} | Format-Table -AutoSize"
echo.
pause
goto MENU

:TOP_MEMORY
cls
echo ===========================================================
echo  [10] TOP 20 MEMORY-HUNGRY PROCESSES
echo ===========================================================
echo.
PowerShell -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 20 Name,Id,@{N='Memory(MB)';E={[math]::Round($_.WorkingSet64/1MB,1)}},@{N='CPU(s)';E={[math]::Round($_.CPU,1)}} | Format-Table -AutoSize"
echo.
echo  --- Total System Memory Usage ---
systeminfo | findstr /C:"Total Physical Memory" /C:"Available Physical Memory"
echo.
pause
goto MENU

:KILL_NAME
cls
echo ===========================================================
echo  [11] KILL PROCESS BY NAME
echo ===========================================================
echo.
set /p pname="Enter Process Name (e.g., chrome): "
echo.
echo  Killing all instances of %pname%...
taskkill /f /im "%pname%.exe" 2>nul
if %errorLevel% equ 0 (
    echo  [DONE] Process killed!
) else (
    taskkill /f /im "%pname%" 2>nul
    if !errorLevel! equ 0 (
        echo  [DONE] Process killed!
    ) else (
        echo  [ERROR] Process not found or access denied.
    )
)
echo.
pause
goto MENU

:KILL_PID
cls
echo ===========================================================
echo  [12] KILL PROCESS BY PID
echo ===========================================================
echo.
set /p pid="Enter Process ID (PID): "
echo.
taskkill /f /pid %pid%
echo.
pause
goto MENU

:PORT_PROCESS
cls
echo ===========================================================
echo  [13] FIND WHICH PROCESS USES A PORT
echo ===========================================================
echo.
set /p port="Enter Port Number: "
echo.
echo  --- Connections on Port %port% ---
netstat -ano | findstr ":%port% "
echo.
echo  --- Process Details ---
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%port% " ^| findstr "LISTENING"') do (
    echo  PID: %%P
    tasklist /fi "PID eq %%P" /fo table /nh
)
echo.
pause
goto MENU

:LIST_TASKS
cls
echo ===========================================================
echo  [14] SCHEDULED TASKS
echo ===========================================================
echo.
schtasks /query /fo TABLE /nh | more
echo.
pause
goto MENU

:CREATE_TASK
cls
echo ===========================================================
echo  [15] CREATE SCHEDULED TASK
echo ===========================================================
echo.
set /p tname="Task Name: "
set /p tpath="Program/Script Path: "
echo.
echo  Schedule Type:
echo  [1] Daily
echo  [2] Weekly
echo  [3] Monthly
echo  [4] At Startup
echo  [5] At Logon
echo  [6] One-Time
set /p sched="Select (1-6): "

if "%sched%"=="1" (
    set /p ttime="Run at what time? (HH:MM): "
    schtasks /create /tn "%tname%" /tr "%tpath%" /sc daily /st !ttime! /f
)
if "%sched%"=="2" (
    set /p ttime="Run at what time? (HH:MM): "
    set /p tday="Day of week? (MON/TUE/WED/THU/FRI/SAT/SUN): "
    schtasks /create /tn "%tname%" /tr "%tpath%" /sc weekly /d !tday! /st !ttime! /f
)
if "%sched%"=="3" (
    set /p ttime="Run at what time? (HH:MM): "
    set /p tday="Day of month? (1-31): "
    schtasks /create /tn "%tname%" /tr "%tpath%" /sc monthly /d !tday! /st !ttime! /f
)
if "%sched%"=="4" (
    schtasks /create /tn "%tname%" /tr "%tpath%" /sc onstart /f
)
if "%sched%"=="5" (
    schtasks /create /tn "%tname%" /tr "%tpath%" /sc onlogon /f
)
if "%sched%"=="6" (
    set /p tdate="Date? (MM/DD/YYYY): "
    set /p ttime="Time? (HH:MM): "
    schtasks /create /tn "%tname%" /tr "%tpath%" /sc once /sd !tdate! /st !ttime! /f
)
echo.
echo  [DONE] Task created!
echo.
pause
goto MENU

:DELETE_TASK
cls
echo ===========================================================
echo  [16] DELETE SCHEDULED TASK
echo ===========================================================
echo.
set /p tname="Enter Task Name to Delete: "
echo.
schtasks /delete /tn "%tname%" /f
echo.
pause
goto MENU
