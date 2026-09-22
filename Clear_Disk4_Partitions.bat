@echo off
title Clear All Partitions on Disk 4 (EVM25 SSD)
color 1F

:: Check Administrator Privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Requesting Administrator Privileges...
    powershell -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

cls
echo ===================================================================
echo     CLEARING ALL PARTITIONS ON DISK 4 (EVM25 512GB SSD)
echo ===================================================================
echo.

(
echo select disk 4
echo clean
) > "%TEMP%\clean_disk4.txt"

diskpart /s "%TEMP%\clean_disk4.txt"
del /f /q "%TEMP%\clean_disk4.txt" >nul 2>&1

echo.
echo ===================================================================
echo     DISK 4 HAS BEEN COMPLETELY WIPED AND UNALLOCATED!
echo ===================================================================
echo.
pause
