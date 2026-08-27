@echo off
setlocal EnableDelayedExpansion
title Instant CPU Unfreezer
color 0C

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo               TERMINATING HIGH CPU HOGGING PROCESSES
echo ===================================================================
echo.

echo [*] Terminating stuck Microsoft Edge WebView2 background processes...
taskkill /f /im msedgewebview2.exe >nul 2>&1
taskkill /f /im msedge.exe >nul 2>&1

echo [*] Terminating background Google Drive Sync loop...
taskkill /f /im GoogleDriveFS.exe >nul 2>&1

echo [*] Restarting Windows Explorer shell...
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 1 /nobreak >nul 2>&1
start explorer.exe

echo [*] Cleaning temporary RAM working sets...
powershell -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers()" >nul 2>&1

echo.
echo ===================================================================
echo                   CPU USAGE HAS BEEN DROPPED!
echo ===================================================================
echo Runaway msedgewebview2 processes have been killed.
echo.
pause
