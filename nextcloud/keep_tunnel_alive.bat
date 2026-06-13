@echo off
:loop
echo [%date% %time%] Starting SSH Reverse Tunnel...
ssh -i "C:\Users\sys1\.ssh\yantrabyte-key.pem" -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=no -R 0.0.0.0:2222:localhost:22 ubuntu@13.205.228.94 -N
echo [%date% %time%] Tunnel disconnected. Restarting in 10 seconds...
timeout /t 10 /nobreak
goto loop
