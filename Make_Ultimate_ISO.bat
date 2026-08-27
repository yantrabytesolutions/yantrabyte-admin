@echo off
setlocal EnableDelayedExpansion
title Ultimate Windows 11 ISO Builder (Home & Pro ONLY)
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Filter_Wim_Home_Pro.ps1"
pause
