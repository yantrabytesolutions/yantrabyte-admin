@echo off
title Force Deleting Partitions on Disk 4 (EVM SSD)
color 1F

:: Check Admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

cls
echo ===================================================================
echo   FORCE DELETING ALL PARTITIONS ON DISK 4 WITH OVERRIDE
echo ===================================================================
echo.

diskpart /s "d:\Antigravity\yantrabyte-bolt\force_delete_disk4.txt"

echo.
echo ===================================================================
echo   OPERATION FINISHED!
echo ===================================================================
echo.
pause
