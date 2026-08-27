@echo off
setlocal EnableDelayedExpansion
title Windows 11 Auto-Install ISO Builder
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Build_ISO.ps1"
pause
