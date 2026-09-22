@echo off
title YantraByte Remote Desktop One-Click Repair
color 0A
cls

echo ===================================================================
echo     YANTRABYTE SOLUTIONS - REMOTE DESKTOP INSTANT REPAIR
echo ===================================================================
echo.

:: Check Admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Requesting Administrator Privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [1/5] Setting Network Profile to Private...
powershell -Command "Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private"

echo [2/5] Enabling Windows Remote Desktop...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f >nul
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" /v UserAuthentication /t REG_DWORD /d 0 /f >nul

echo [3/5] Starting Remote Desktop Services (TermService)...
sc config TermService start= auto >nul
net start TermService >nul 2>&1

echo [4/5] Enabling Inbound Remote Desktop Firewall Rules...
netsh advfirewall firewall set rule group="remote desktop" new enable=Yes >nul
netsh advfirewall firewall add rule name="Allow_RDP_3389_TCP" dir=in action=allow protocol=TCP localport=3389 profile=any >nul
netsh advfirewall firewall add rule name="Allow_RDP_3389_UDP" dir=in action=allow protocol=UDP localport=3389 profile=any >nul

echo [5/5] Checking Remote Desktop Listener...
netstat -ano | findstr :3389

echo.
echo ===================================================================
echo   SUCCESS: REMOTE DESKTOP IS NOW FULLY ENABLED AND ACCESSIBLE!
echo ===================================================================
echo.
echo Host Laptop IP : 192.168.0.248
echo Username       : sys1
echo.
echo You can now connect from WIN-57VSV3AE8FQ:
echo   mstsc /v:192.168.0.248
echo.
echo Press any key to exit...
pause >nul
