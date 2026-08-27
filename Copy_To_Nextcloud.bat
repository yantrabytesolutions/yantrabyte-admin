@echo off
title Syncing ISOs to Nextcloud (anantatechcare.com)

set DEST1=K:\nextcloud\Data\yantrabyte.solutions@gmail.com\files
set DEST2=K:\nextcloud\Data\admin\files

echo [*] Syncing win11_fast_autoinstall.iso to Nextcloud...
if exist "%DEST1%" copy /y "D:\win11_fast_autoinstall.iso" "%DEST1%\"
if exist "%DEST2%" copy /y "D:\win11_fast_autoinstall.iso" "%DEST2%\"

echo [*] Syncing YantraByte_Solutions_Master_Rescue.iso to Nextcloud...
if exist "%DEST1%" copy /y "D:\YantraByte_Solutions_Master_Rescue.iso" "%DEST1%\"
if exist "%DEST2%" copy /y "D:\YantraByte_Solutions_Master_Rescue.iso" "%DEST2%\"

echo [OK] Nextcloud Sync Complete for anantatechcare.com!
pause
