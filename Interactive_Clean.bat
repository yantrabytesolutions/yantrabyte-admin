@echo off
color 1F

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process cmd.exe -ArgumentList '/k \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo Running Diskpart Output Capture...
(
echo select disk 4
echo detail disk
echo clean
) | diskpart

echo.
echo ========================================
echo Finished. Review the lines above!
pause
