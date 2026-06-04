@echo off
REM ================================================
REM  Nextcloud Data Backup: Drive K: -> Drive L:
REM  Runs daily via Windows Task Scheduler
REM ================================================

set SOURCE=K:\nextcloud-data
set DEST=L:\nextcloud-backup
set LOG=D:\Antigravity\nextcloud\backup.log

echo [%date% %time%] Starting backup K: to L: >> "%LOG%"

robocopy "%SOURCE%" "%DEST%" /MIR /Z /MT:8 /R:3 /W:10 /LOG+:"%LOG%" /TEE

echo [%date% %time%] Backup complete >> "%LOG%"
