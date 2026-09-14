@echo off
title Syncing ISOs to Nextcloud (anantatechcare.com)

set DEST1=K:\nextcloud\Data\yantrabyte.solutions@gmail.com\files
set DEST2=K:\nextcloud\Data\admin\files

echo [*] Syncing win11_ultimate_autoinstall.iso to Nextcloud...
if exist "D:\win11_ultimate_autoinstall.iso" (
    if exist "%DEST1%" robocopy "D:\." "%DEST1%" "win11_ultimate_autoinstall.iso" /J /NJH /NJS /NDL /NC /NS /NP
    if exist "%DEST2%" robocopy "D:\." "%DEST2%" "win11_ultimate_autoinstall.iso" /J /NJH /NJS /NDL /NC /NS /NP
)

echo [*] Syncing YantraByte_Solutions_Master_Rescue.iso to Nextcloud...
if exist "D:\YantraByte_Solutions_Master_Rescue.iso" (
    if exist "%DEST1%" robocopy "D:\." "%DEST1%" "YantraByte_Solutions_Master_Rescue.iso" /J /NJH /NJS /NDL /NC /NS /NP
    if exist "%DEST2%" robocopy "D:\." "%DEST2%" "YantraByte_Solutions_Master_Rescue.iso" /J /NJH /NJS /NDL /NC /NS /NP
)

echo [OK] Nextcloud Sync Complete for anantatechcare.com!
if "%1"=="--interactive" pause


