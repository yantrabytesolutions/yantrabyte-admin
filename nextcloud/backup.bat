@echo off
REM ================================================
REM  Nextcloud Data Backup: Drive K: -> Drive L:
REM  Runs daily via Windows Task Scheduler
REM ================================================

set SOURCE_NC=K:\nextcloud\Data
set DEST_NC=L:\nextcloud-backup
set SOURCE_MOBILE="K:\Guru mobile backup"
set DEST_MOBILE="L:\Guru mobile backup"
set LOG=D:\Antigravity\nextcloud\backup.log

echo [%date% %time%] Starting backup K: to L: >> "%LOG%"

echo [%date% %time%] Backing up Nextcloud Data... >> "%LOG%"
robocopy "%SOURCE_NC%" "%DEST_NC%" /MIR /Z /MT:8 /R:3 /W:10 /LOG+:"%LOG%" /TEE

echo [%date% %time%] Backing up Guru Mobile Backup... >> "%LOG%"
robocopy %SOURCE_MOBILE% %DEST_MOBILE% /MIR /Z /MT:8 /R:3 /W:10 /LOG+:"%LOG%" /TEE

echo [%date% %time%] Backup complete >> "%LOG%"
