@echo off
title YantraByte Antigravity Remote Agent Installer
color 1F

:: Auto-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo   YANTRABYTE ANTIGRAVITY REMOTE MANAGEMENT INSTALLER
echo   CUSTOMER: Sougandh (sougandh.mm@gmail.com)
echo ===================================================================
echo.

set "TARGET_DIR=C:\Antigravity"
echo [*] Step 1: Creating Antigravity Runtime Directory at %TARGET_DIR%...
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%" >nul 2>&1

echo [*] Step 2: Generating Core Remote Tunnel Components...

:: Create run_tunnel_hidden.vbs
(
echo Set WinScriptHost = CreateObject("WScript.Shell"^)
echo WinScriptHost.Run Chr(34^) ^& "C:\Antigravity\start_tunnel.bat" ^& Chr(34^), 0
echo Set WinScriptHost = Nothing
) > "%TARGET_DIR%\run_tunnel_hidden.vbs"

:: Create start_tunnel.bat
(
echo @echo off
echo cd /d C:\Antigravity
echo :loop
echo cmd /c "C:\Antigravity\tunnel_service.bat"
echo timeout /t 10 /nobreak ^>nul
echo goto loop
) > "%TARGET_DIR%\start_tunnel.bat"

:: Copy existing tunnel_service.bat if present
if exist "%~dp0tunnel_service.bat" (
    copy /y "%~dp0tunnel_service.bat" "%TARGET_DIR%\" >nul 2>&1
) else if exist "D:\Antigravity\tunnel_service.bat" (
    copy /y "D:\Antigravity\tunnel_service.bat" "%TARGET_DIR%\" >nul 2>&1
)

echo [*] Step 3: Registering Antigravity Auto-Start Task on Windows Boot...
schtasks /create /tn "YantraByteAntigravityTunnel" /tr "wscript.exe \"%TARGET_DIR%\run_tunnel_hidden.vbs\"" /sc onstart /ru SYSTEM /f >nul 2>&1

echo [*] Step 4: Starting Antigravity Remote Management Tunnel...
start "" wscript.exe "%TARGET_DIR%\run_tunnel_hidden.vbs"

echo.
echo ===================================================================
echo   ANTIGRAVITY REMOTE AGENT INSTALLED AND CONNECTED SUCCESSFULLY!
echo ===================================================================
echo.
pause
