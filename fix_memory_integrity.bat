@echo off
setlocal EnableDelayedExpansion
title Fix Incompatible Drivers for Memory Integrity
color 1F

:: Self-elevate to Administrator
net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)

cls
echo ===================================================================
echo        REMOVING INCOMPATIBLE DRIVERS FOR MEMORY INTEGRITY
echo ===================================================================
echo.
echo Searching for old incompatible Intel drivers (igdkmd64.sys / igdkmd64lp.sys)...
echo.

powershell -NoProfile -Command ^
 "$drivers = pnputil /enum-drivers;" ^
 "$incompatible = @();" ^
 "for ($i = 0; $i -lt $drivers.Count; $i++) {" ^
 "    if ($drivers[$i] -match 'Published Name:\s+(oem\d+\.inf)') {" ^
 "        $oem = $matches[1];" ^
 "        $block = ($drivers[$i..($i+10)] -join ' ');" ^
 "        if ($block -match 'Intel' -or $block -match 'Display' -or $block -match 'Graphics') {" ^
 "            $incompatible += $oem;" ^
 "        }" ^
 "    }" ^
 "};" ^
 "if ($incompatible.Count -eq 0) {" ^
 "    Write-Host '[*] Checking all OEM display drivers...';" ^
 "    $allOem = Get-ChildItem 'C:\Windows\INF\oem*.inf' | Select-String -Pattern 'igdkmd64' | Select-Object -Unique -ExpandProperty Path;" ^
 "    foreach ($f in $allOem) {" ^
 "        $infName = Split-Path $f -Leaf;" ^
 "        Write-Host \"Removing driver: $infName ...\" -ForegroundColor Yellow;" ^
 "        & pnputil /delete-driver $infName /uninstall /force;" ^
 "    }" ^
 "} else {" ^
 "    $allOem = Get-ChildItem 'C:\Windows\INF\oem*.inf' | Select-String -Pattern 'igdkmd64' | Select-Object -Unique -ExpandProperty Path;" ^
 "    foreach ($f in $allOem) {" ^
 "        $infName = Split-Path $f -Leaf;" ^
 "        Write-Host \"Removing driver: $infName ...\" -ForegroundColor Yellow;" ^
 "        & pnputil /delete-driver $infName /uninstall /force;" ^
 "    }" ^
 "};" ^
 "Write-Host 'Driver cleanup completed.' -ForegroundColor Green"

echo.
echo ===================================================================
echo                        CLEANUP FINISHED!
echo ===================================================================
echo.
echo 1. Open Windows Security -> Device Security -> Core Isolation Details.
echo 2. Click 'Scan Again' / Toggle 'Memory Integrity' to ON.
echo 3. Restart your computer.
echo.
pause
