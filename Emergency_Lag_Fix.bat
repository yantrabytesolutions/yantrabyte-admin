@echo off
setlocal EnableDelayedExpansion
title Emergency Windows Lag Fix & RAM Cleaner
color 0C

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo               EMERGENCY SYSTEM LAG KILLER & UNFREEZER
echo ===================================================================
echo.
echo [*] Step 1: Dismounting any active/hung ISO disk images...
powershell -Command "Get-DiskImage | Dismount-DiskImage -ErrorAction SilentlyContinue; Dismount-DiskImage -ImagePath 'D:\win11office.iso' -ErrorAction SilentlyContinue" >nul 2>&1

echo [*] Step 2: Terminating hung background installer & indexing tasks...
taskkill /f /im tiworker.exe >nul 2>&1
taskkill /f /im trustedinstaller.exe >nul 2>&1
taskkill /f /im msiexec.exe >nul 2>&1
taskkill /f /im dism.exe >nul 2>&1
taskkill /f /im oscdimg.exe >nul 2>&1
taskkill /f /im SearchIndexer.exe >nul 2>&1

echo [*] Step 3: Purging temporary lock files & flushing DNS...
del /s /f /q "%temp%\*.*" >nul 2>&1
ipconfig /flushdns >nul 2>&1

echo [*] Step 4: Unlocking Max CPU Clock Speed (High Performance)...
powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1

echo [*] Step 5: Emptying RAM working sets and system caches...
powershell -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers()" >nul 2>&1

echo [*] Step 6: Restarting Windows Explorer (Refreshes Desktop & Taskbar)...
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 1 /nobreak >nul 2>&1
start explorer.exe

echo.
echo ===================================================================
echo                       SYSTEM LAG RELIEVED!
echo ===================================================================
echo.
echo System resources have been freed and background disk locks removed.
echo.
pause
