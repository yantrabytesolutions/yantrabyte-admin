@echo off
:loop
cloudflared.exe tunnel run bd9dc60b-6512-4957-bba2-66a2898e66aa
timeout /t 3
goto loop
