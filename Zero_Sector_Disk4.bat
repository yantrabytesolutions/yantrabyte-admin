@echo off
title Raw MBR Zero Tool - Disk 4 (EVM SSD)
color 4F

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process cmd.exe -ArgumentList '/k \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo ===================================================================
echo     ZEROING RAW SECTOR 0 (MBR PARTITION TABLE) ON PHYSICALDRIVE4
echo ===================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$stream = [System.IO.File]::Open('\\.\PhysicalDrive4', [System.IO.FileMode]::Open, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite); $zeros = New-Object byte[] 1048576; $stream.Write($zeros, 0, $zeros.Length); $stream.Flush(); $stream.Close(); Write-Host '[SUCCESS] 1MB (2048 Sectors) completely zeroed on PhysicalDrive4!' -ForegroundColor Green"

echo.
echo Refreshing Windows disk table...
(
echo rescan
) | diskpart

echo.
echo ===================================================================
pause
