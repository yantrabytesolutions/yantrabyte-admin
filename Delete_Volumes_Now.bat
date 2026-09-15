@echo off
color 1F

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process cmd.exe -ArgumentList '/k \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo ===================================================================
echo   FORCE DELETING VOLUMES ON DISK 4 (VOLUMES 9, 10, 11, 12)
echo ===================================================================
echo.

diskpart /s "d:\Antigravity\yantrabyte-bolt\clean_volumes.txt"

echo.
echo ===================================================================
echo Finished. Check the messages above!
pause
